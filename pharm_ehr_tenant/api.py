import frappe, json
from frappe.utils import getdate, get_site_base_path, add_days, today, cint
from datetime import timedelta, datetime
from healthcare.healthcare.doctype.patient_appointment.patient_appointment import (
    check_employee_wise_availability,
    get_available_slots as avail_slots,
)
from erpnext.accounts.doctype.payment_request.payment_request import (
    make_payment_request,
)
import datetime as dt
from icalendar import Calendar, Event
import os


@frappe.whitelist(allow_guest=True)
def get_event_services(event):
    ser_unit = frappe.get_value("Event", event, "custom_service_unit")

    res = frappe.db.sql(
        '''
						SELECT
							es.vaccine_type as service_name,
							at.default_duration as duration_in_min,
							at.custom_orig_description as description,
							i.op_consulting_charge as charge
						FROM
							`tabEvent Services` AS es
						JOIN
							`tabAppointment Type` AS at
						ON
							at.name = es.vaccine_type
						JOIN
							`tabAppointment Type Service Item` AS i
						ON
							i.parent = at.name
						WHERE
							es.parent = "{0}"
						AND
							i.dn = "{1}"'''.format(
            event, ser_unit
        ),
        as_dict=1,
    )
    return {
        "data": res,
        "do_no_allow_payment": frappe.db.get_value(
            "Event", event, "custom_do_not_collect_payment"
        ),
        "logo_url": frappe.db.get_single_value("Website Settings", "app_logo"),
    }


# @frappe.whitelist(allow_guest = True)
# def get_available_slots(event):
#     doc = frappe.get_doc("Event",event)
#     start_date = str(getdate(doc.starts_on))
#     end_date = str(getdate(doc.ends_on))
#     dates_between = get_dates_in_range(start_date, end_date)
#     doctor_list = [doct["reference_docname"] for doct in frappe.db.sql('''select reference_docname from `tabEvent Participants` where reference_doctype = "Healthcare Practitioner" and reference_docname is not null and parent = "{0}" '''.format(event),as_dict = 1)]
#     slot_details_res = []
#     for name in doctor_list:
#         print(name)
#         practitioner_doc = frappe.get_doc("Healthcare Practitioner",name)
#         slot_dict = {
#                 "practitioner_id":name,
#                 "practitioner_name":practitioner_doc.practitioner_name
#             }
#         date_and_slots = {}
#         for date in dates_between:
#             print(date)
#             date = getdate(date)
#             check_employee_wise_availability(date, practitioner_doc)
#             if practitioner_doc.practitioner_schedules:
#                 slot_details = avail_slots(practitioner_doc, date)
#                 print(slot_details)
#                 all_slots = []
#                 booked = []
#                 for detail in slot_details:
#                     for slot in detail["avail_slot"]:
#                         all_slots.append(slot.from_time)
#                     for appo in detail['appointments']:
#                         booked.append(appo['appointment_time'])
#                 date_and_slots[str(date)] = {
#                     "day":getdate(date).strftime("%A"),
#                     "month":getdate(date).strftime("%b"),
#                     "year":getdate(date).year,
#                     "slot_list":[str(i) for i in sorted(list(set(all_slots)-set(booked)))]
#                     }
#         slot_dict["dates_and_slots"] = date_and_slots
#         slot_details_res.append(slot_dict)
#     return  slot_details_res

# @frappe.whitelist(allow_guest = True)
# def get_all_available_slots(event, services):
#     doc = frappe.get_doc("Event",event)
#     start_date = str(getdate(doc.starts_on))
#     end_date = str(getdate(doc.ends_on))
#     dates_between = get_dates_in_range(start_date, end_date)
#     service_unit = frappe.get_doc("Healthcare Service Unit",doc.custom_service_unit)
#     slots = {}
#     # import pdb; pdb.set_trace()
#     for date in dates_between:
#         start_time = datetime.strptime(str(service_unit.custom_opening_time), "%H:%M:%S")
#         end_time = datetime.strptime(str(service_unit.custom_closing_time), "%H:%M:%S")
#         total_duration = 0
#         for service in services:
#             total_duration += frappe.db.get_value("Appointment Type",service,"default_duration") or 0
#         slot_list = generate_time_slots(start_time, end_time, total_duration)
#         appointments = frappe.db.get_list("Patient Appointment",{"appointment_date":date, "appointment_for":"Service Unit","service_unit":doc.custom_service_unit},["appointment_time","duration"])
#         for time in appointments:
#             time_string = str(time["appointment_time"]).split(".")[0]
#             time_object = datetime.strptime(time_string, "%H:%M:%S")
#             minutes_to_add = time["duration"]
#             new_time_object = time_object + timedelta(minutes=minutes_to_add)
#             new_time_string = new_time_object.strftime("%H:%M:%S")
#             non_overlapping_slots = filter_non_overlap(slot_list, time_string, new_time_string)
#             slot_list = non_overlapping_slots
#         slots.update({date : slot_list})
#     days= []
#     if doc.monday:days.append('monday')
#     if doc.tuesday:days.append('tuesday')
#     if doc.wednesday:days.append('wednesday')
#     if doc.thursday:days.append('thursday')
#     if doc.friday:days.append('friday')
#     if doc.saturday:days.append('saturday')
#     if doc.sunday:days.append('sunday')

#     slots["periods"]=  {"start": start_date, "end": end_date, "date_range": dates_between}
#     slots['days'] = days
#     return slots


@frappe.whitelist(allow_guest=True)
def get_all_available_slots(event, services, date):
    doc = frappe.get_doc("Event", event)

    service_unit = frappe.get_doc("Healthcare Service Unit", doc.custom_service_unit)
    units = service_unit.service_unit_capacity

    units = (
        service_unit.service_unit_capacity if service_unit.overlap_appointments else 0
    )

    start_time = datetime.strptime(str(service_unit.custom_opening_time), "%H:%M:%S")
    end_time = datetime.strptime(str(service_unit.custom_closing_time), "%H:%M:%S")

    total_duration = 0
    for service in services:
        total_duration += (
            frappe.db.get_value("Appointment Type", service, "default_duration") or 0
        )

    slot_list = generate_time_slots(start_time, end_time, total_duration)

    print("slotlist\n\n\n\n", slot_list)
    open_slots = []
    for slot in slot_list:
        count = frappe.db.sql(
            """
				Select name from `tabPatient Appointment` where appointment_date= '{date}' and
				appointment_for = '{appointment_for}' and service_unit = '{service_unit}' and
				appointment_time BETWEEN '{s_time}' and '{e_time}'
			""".format(
                date=frappe.utils.getdate(date),
                appointment_for="Service Unit",
                service_unit=doc.custom_service_unit,
                s_time=slot[0],
                e_time=slot[1],
            )
        )

        # if len(count) < units:
        # 	open_slots.append(slot)
        if units:
            if len(count) < units:
                open_slots.append(slot)
        else:
            if not len(count):
                open_slots.append(slot)
    return {date: open_slots}


@frappe.whitelist(allow_guest=True)
def get_all_available_dates(event):
    doc = frappe.get_doc("Event", event)
    start_date = str(getdate(doc.starts_on))
    end_date = str(getdate(doc.ends_on))
    dates = {}

    days = []
    if doc.monday:
        days.append("Mon")
    if doc.tuesday:
        days.append("Tue")
    if doc.wednesday:
        days.append("Wed")
    if doc.thursday:
        days.append("Thu")
    if doc.friday:
        days.append("Fri")
    if doc.saturday:
        days.append("Sat")
    if doc.sunday:
        days.append("Sun")

    dates["periods"] = {"start": start_date, "end": end_date}
    dates["days"] = days
    return dates


def slot_has_booked(date, slot, units):
    appointments = frappe.db.count(
        "Patient Appointment", {"appointment_date": date, "appointment_time": slot}
    )
    if appointments >= units:
        return True


def filter_non_overlap(time_slots, start_range, end_range):
    start_range = datetime.strptime(start_range, "%H:%M:%S").time()
    end_range = datetime.strptime(end_range, "%H:%M:%S").time()

    non_overlapping_slots = []

    for slot in time_slots:
        slot_start = datetime.strptime(slot[0], "%H:%M:%S").time()
        slot_end = datetime.strptime(slot[1], "%H:%M:%S").time()

        # Check if the slot's end is before the start_range or its start is after the end_range
        if slot_end <= start_range or slot_start >= end_range:
            non_overlapping_slots.append(slot)

    return non_overlapping_slots


def generate_time_slots(start_time, end_time, duration):
    time_slots = []
    current_time = start_time

    while current_time < end_time:
        next_time = current_time + timedelta(minutes=duration)
        if next_time > end_time:
            time_slots.append(
                (current_time.strftime("%H:%M:%S"), end_time.strftime("%H:%M:%S"))
            )
        else:
            time_slots.append(
                (current_time.strftime("%H:%M:%S"), next_time.strftime("%H:%M:%S"))
            )
        current_time = next_time

    return time_slots


def get_dates_in_range(start_date, end_date):
    # Define an empty list to store the dates
    dates_list = []

    # Convert the start and end dates to datetime objects
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")

    # Iterate over the range of dates and append each date to the list
    current_dt = start_dt
    while current_dt <= end_dt:
        dates_list.append(current_dt.strftime("%Y-%m-%d"))
        current_dt += timedelta(days=1)

    return dates_list


# post apis
@frappe.whitelist(allow_guest=True)
def book_patient_appointment(**kwargs):
    if isinstance(kwargs, str):
        kwargs = json.loads(kwargs)

    patient = get_patient_details(kwargs)

    success_msg = create_patient_appointment(patient, kwargs)

    return {
        "patient": patient.name,
        "success_msg": success_msg["success_msg"],
        "patient_appointments": success_msg["patient_appointments"],
    }


def get_patient_details(kwargs):

    patient_details = kwargs.get("patient_details")
    if patient := frappe.db.exists(
        "Patient",
        {"mobile": patient_details.get("mobile"), "dob": patient_details.get("dob")},
    ):
        return frappe.get_doc("Patient", patient)

    return create_patient(patient_details)


def create_patient(patient_details):
    patient_details = frappe._dict(patient_details)
    pat_doc = frappe.new_doc("Patient")
    pat_doc.first_name = patient_details.first_name
    pat_doc.last_name = patient_details.last_name
    pat_doc.mobile = patient_details.mobile
    pat_doc.sex = patient_details.gender
    pat_doc.email = patient_details.email
    pat_doc.dob = getdate(patient_details.dob)
    pat_doc.custom_payment_type = patient_details.payment_type
    pat_doc.custom_policy_number = patient_details.policy_number
    pat_doc.custom_primary_carrier = patient_details.primary_carrier
    pat_doc.custom_is_the_patient_the_primary_policy_holder = (
        patient_details.patient_primary_policy
    )
    pat_doc.custom_primary_holder_first_name = patient_details.policy_holder_firstName
    pat_doc.custom_primary_holder_middle_name = patient_details.policy_holder_middleName
    pat_doc.custom_primary_holder_last_name = patient_details.policy_holder_lastName
    pat_doc.custom_primary_holder_dob = patient_details.policy_holder_dob
    pat_doc.custom_relationship_to_policy_holder = (
        patient_details.policy_holder_relationship
    )
    pat_doc.custom_medical_record_number = patient_details.medical_record_number
    pat_doc.custom_group_number = patient_details.group_number
    pat_doc.save(ignore_permissions=True)

    return pat_doc


def create_patient_appointment(patient, kwargs):
    success_msg = ""
    time = 0
    services = kwargs.get("services")

    appointment_list = []
    for i, service in enumerate(services):
        appoint_ment = frappe.new_doc("Patient Appointment")
        appoint_ment.appointment_type = service
        appoint_ment.appointment_for = "Service Unit"
        appoint_ment.service_unit = frappe.get_value(
            "Event", kwargs.get("event"), "custom_service_unit"
        )
        appoint_ment.custom_event_id = kwargs.get("event")
        appoint_ment.appointment_date = getdate(kwargs.get("date"))
        appoint_ment.patient = patient.name

        if i:
            time = get_new_appointment_time(services[i - 1], time)
        else:
            time = kwargs.get("time")
        appoint_ment.appointment_time = time
        # import pdb; pdb.set_trace()
        appoint_ment.insert(ignore_permissions=True)
        appointment_list.append(appoint_ment.name)
        if kwargs.get("event"):
            frappe.db.set_value(
                "Event",
                kwargs.get("event"),
                "custom_patient_appointment_count",
                cint(
                    frappe.db.get_value(
                        "Event", kwargs.get("event"), "custom_patient_appointment_count"
                    )
                )
                + 1,
            )
        success_msg += f"{service} Appointment Booked\n"

    # ical_url = get_ical(services, kwargs.get('date'), kwargs.get('time'), patient.patient_name)

    return {"success_msg": success_msg}  # , ical_url: ical_url}

    return {
        "success_msg": success_msg,
        "patient_appointments": appointment_list,
    }  # , ical_url: ical_url}


def get_new_appointment_time(service, time):
    current_time = datetime.strptime(str(time), "%H:%M:%S")
    duration = frappe.get_value("Appointment Type", service, "default_duration")
    new_time = current_time + timedelta(minutes=duration)
    return new_time.time()


@frappe.whitelist(allow_guest=True)
def get_questionnaires(event=None, services=None):
    # return services
    if not services:
        return "Mandatory field Services"

    get_questionnaires = []
    uniqu_question = []

    for service in services:
        template = frappe.db.sql(
            """
		select
			parent from `tabQuestionnaires Vaccine Type`
		where
			vaccine_type = "{}"
		order by creation desc limit 1""".format(
                service
            ),
            as_dict=1,
        )
        template = frappe.db.sql(
            """
			select questionnaire_template from `tabAppointment Questionnaires`
			where parent = "{}"
			""".format(
                service
            ),
            as_dict=1,
        )
        questions = []
        if template:
            for temp in template:
                questions += frappe.db.sql(
                    """
					select
						parent as template, question_no, description from `tabQuestions Description`qd
					where
						qd.parent = '{}'""".format(
                        temp.get("questionnaire_template")
                    ),
                    as_dict=1,
                )

            temp_question = questions.copy()

            for i in range(len(temp_question)):
                if temp_question[i].question_no not in uniqu_question:
                    uniqu_question.append(temp_question[i].question_no)
                else:
                    questions.remove(temp_question[i])
            if questions:
                get_questionnaires.append({service: questions})

    return get_questionnaires


@frappe.whitelist(allow_guest=True)
def create_questionnaire_response(**kwargs):

    if isinstance(kwargs, str):
        kwargs = json.loads(kwargs)

    for res in kwargs.get("questionnaire_response"):
        res_doc = frappe.new_doc("Questionnaires Response")
        res_doc.patient_name = kwargs.get("patient")
        res_doc.form_type = frappe.get_value(
            "Event Services", {"parent": kwargs.get("event")}, "service_type"
        )

        service, qa = list(res.items())[0]

        res_doc.vaccine_type = service
        for q in qa:
            res_doc.append(
                "vaccine_questions",
                {"question_no": q.get("question_no"), q.get("answer").lower(): 1},
            )

        res_doc.save(ignore_permissions=True)
    immn_name = create_immunization_service(kwargs.get("patient"))

    return {"immunization_id": immn_name}


@frappe.whitelist(allow_guest=True)
def create_immunization_service(patient):
    is_doc = frappe.new_doc("Immunization Service")
    is_doc.patient_name = patient
    is_doc.save(ignore_permissions=True)

    return is_doc.name


@frappe.whitelist(allow_guest=True)
def get_ical(services, date, time, patient):

    cal = Calendar()

    bench = __file__.split("apps")[0]

    site_path = get_site_base_path()[1:]

    filename = (
        bench
        + "sites"
        + site_path
        + "/public/files/"
        + patient.patient_name
        + "_"
        + date
        + "_"
        + time
        + ".ics"
    )

    # return filename

    for service in services:
        event_obj = Event()
        event_obj.add(
            "summary", "Scheduled for service {service}".format(service=service)
        )
        start = datetime.datetime.strptime(date + " " + time, "%Y-%m-%d %H:%M:%S")
        event_obj.add("dtstart", start)
        current_time = datetime.datetime.strptime(time, "%H:%M:%S")
        duration = frappe.get_value("Appointment Type", service, "default_duration")
        new_time = current_time + timedelta(minutes=duration)
        time = new_time
        end = datetime.datetime.strptime(
            date + " " + str(time.time()), "%Y-%m-%d %H:%M:%S"
        )
        event_obj.add("dtend", end)
        event_obj.add(
            "description",
            "Your Appointment has Scheduled at {date} for service {service}".format(
                date=date, service=service
            ),
        )
        cal.add_component(event_obj)

    with open(filename, "wb") as f:
        f.write(cal.to_ical())

    try:
        origin = frappe.utils.get_url()

        f_name = patient.patient_name + "_" + service + "_" + date + "_" + str(time)

        doc = frappe.new_doc("File")
        doc.file_name = f_name + ".ics"
        doc.is_private = 0

        doc.file_url = "/files/" + f_name + ".ics"
        doc.save()
    except Exception as e:
        print(e)
    else:
        return doc.file_url


@frappe.whitelist(allow_guest=True)
def get_mobile_format():
    company = frappe.defaults.get_defaults().company
    if not company:
        return ""
    return frappe.db.get_value("Company", company, "custom_mobile_number_format")


@frappe.whitelist(allow_guest=True)
def get_payment_url(event, services, patient, immn_name):
    service_unit = frappe.db.get_value("Event", event, "custom_service_unit")
    sal = frappe.new_doc("Sales Invoice")
    sal.due_date = add_days(today(), 3)
    sal.patient = patient
    sal.customer = frappe.db.get_value("Patient", patient, "customer")
    sal.custom_service_type = "Immunization Service"
    sal.custom_service_name = immn_name
    sal.service_unit = service_unit
    for name in services:
        service = frappe.get_doc("Appointment Type", name)
        for item in service.items:
            if item.dn == service_unit:
                sal.append(
                    "items",
                    {
                        "item_code": item.op_consulting_charge_item,
                        "qty": 1,
                        "rate": item.op_consulting_charge,
                        "uom": "Nos",
                    },
                )

    sal.save(ignore_permissions=True)
    sal.submit()
    args = {
        "dt": "Sales Invoice",
        "dn": sal.name,
        "recipient_id": sal.contact_email,
        "payment_request_type": "Inward",
        "party_type": "Customer",
        "party": sal.customer,
    }
    pay_req = make_payment_request(**args)
    pay_req["doctype"] = "Payment Request"
    pay_req["message"] = (
        '<p>Dear {{ doc.contact_person }},</p><br><p>Requesting payment for {{ doc.doctype }}, {{ doc.name }} for {{ doc.grand_total }}.</p><br><a href="{{ payment_url }}"> click here to pay </a>'
    )
    pay_req["email_to"] = (
        frappe.db.get_value("Patient", patient, "email")
        or frappe.db.get_value(
            "Contact",
            frappe.db.get_value(
                "Dynamic Link",
                {"link_doctype": "Patient", "link_name": patient},
                "parent",
            ),
            "email_id",
        )
        or "Administrator"
    )
    del pay_req["name"]
    pay = frappe.get_doc(pay_req)
    pay.insert(ignore_permissions=True)
    pay.submit()
    return {"payment_url": pay.get_payment_url()}


@frappe.whitelist(allow_guest=True)
def get_appointment_questionnaires(docname):
    frappe.response.template = []
    app_doc = frappe.get_doc("Appointment Type", docname)
    if len(app_doc.custom_questionnaire_template):
        frappe.response.template = [
            row.questionnaire_template for row in app_doc.custom_questionnaire_template
        ]


# CREATE BULK OPPORTUNITIES
@frappe.whitelist()
def create_bulk_opportunities(
    doctype="Patient",
    names=[],
):
    try:
        names = frappe.parse_json(names)

        for name in names:
            old_doc = frappe.get_doc(doctype, name)

            new_doc = frappe.new_doc("Opportunity")

            new_doc.update(
                {
                    "opportunity_from": "Customer",
                    "party_name": old_doc.customer,
                },
            )

            new_doc.save()

            frappe.db.commit()

            return {"success": True}

    except Exception as e:
        raise e
