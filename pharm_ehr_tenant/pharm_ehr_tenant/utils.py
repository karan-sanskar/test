import math
import frappe

import json

from frappe.utils.data import get_url_to_form
from frappe.model.naming import parse_naming_series

from frappe.utils import cstr,today

@frappe.whitelist()
def get_all_diagnosis():
	return sorted(frappe.get_list("Diagnosis", pluck="name", order_by= "name"))

@frappe.whitelist()
def get_all_eligibility_criteria(template):
	if not template:
		return []
	# template = frappe.db.get_value(service_type,service_name,"patient_eligibility_template")
	criteria = frappe.db.sql('''select criteria,idx from `tabPatient Eligibility Points` where parent = '{0}' order by idx'''.format(template),as_dict =1)
	for data in criteria:
		data["criteria"] = str(data["criteria"])
	criteria_list = ["{0}".format(data["criteria"]) for data in criteria]
	criteria_list = dict(enumerate(criteria_list))
	return criteria_list
def on_update_after_submit(doc, method ):
	if doc.workflow_state == "Rejected" and not doc.custom_reason_for_rejection:
		return frappe.throw("<b>Reason for rejection</b> cannot be empty!", title="Mandatory Error")
	
@frappe.whitelist()
def create_sales_invoice(doc, item):
	service_doc = json.loads(doc)
	
	sales_doc = frappe.new_doc("Sales Invoice")
	sales_doc.posting_date = service_doc.get("cmr_complted")
	sales_doc.due_date = service_doc.get("cmr_complted")
	sales_doc.patient = service_doc.get("patient_name")
	sales_doc.customer = service_doc.get("patient_name")
	sales_doc.custom_service_type = service_doc.get("doctype")
	sales_doc.custom_service_name = service_doc.get("name")
	
	sales_doc.append(
		"items",
		{
			"item_code": item,
			"qty": 1 #service_doc.get("total_duration")
		},
	)
	
	sales_doc.save()
	
	return sales_doc

@frappe.whitelist()
def validate_sales_invoice(doc, method):
	if sales:=frappe.db.exists(
		"Sales Invoice",
		{
			"custom_service_type": doc.custom_service_type,
			"custom_service_name": doc.custom_service_name,
			"name": ["!=", doc.name]
		}):
		frappe.throw("Visit the sales invoice for {} - {}".format(
			frappe.bold(doc.custom_service_name),
			frappe.bold("<a href= "+ get_url_to_form("Sales Invoice", sales)+">{}</a>".format(sales))
		), title= "For service, a sales invoice is already exists")
	
def autoname(self,method):
	return
	# uid = frappe.db.sql('''select uid from `tabPatient` order by uid desc limit 1''',as_dict = 1)
	# if not len(uid) or "uid" not in uid[0] or not uid[0]["uid"]:
	#     pid = "P00001"
	#     self.uid = pid
	#     return
	# pid = uid[0]["uid"]
	# next_pid = get_next_pid(pid,self)
	# while frappe.db.get_value("Patient",{"uid":next_pid}):
	#     next_pid = get_next_pid(next_pid,self)
	# self.uid = next_pid

def get_next_pid(pid,self):
	series_list = self.custom_patient_series.split(".")
	hash_dig = ""
	for series in series_list:
		if series.startswith("#"):
			hash_dig = series
			break
	val = int(pid.split("P")[1])+1
	if not val:
		return "P00001"
	if len(str(val)) < len(hash_dig):
		o_dig = ""
		for i in range(0,len(hash_dig)-len(str(val))):
			o_dig += "0"
		o_dig += str(val)
		prev_dig = "P"+o_dig
	return prev_dig

@frappe.whitelist()
def get_item(doctype, txt, searchfield, start, page_len, filters):
	minutes = filters.get("duration")
	if not minutes:
		minutes = 1
	duration = math.ceil( minutes/15 )  * 15
	data = frappe.db.sql("""
				SELECT name, item_name, item_code, item_group, description
				FROM `tabItem`
				WHERE item_group = '{}' AND custom_duration <= {} """
				.format(filters.get('item_group'), duration))
	return data
@frappe.whitelist()
def get_appointment_type_for_service(doctype, txt, searchfield, start, page_len, filters):
	data = frappe.db.sql('''select name, default_duration,custom_service_type from `tabAppointment Type` where custom_service_type = "{0}"'''.format(filters.get('custom_service_type')))
	return data
@frappe.whitelist()
def get_patient(doctype, txt, searchfield, start, page_len, filters):
	data = frappe.db.sql("""
				SELECT patient_name, patient_name, dob, email, mobile
				FROM `tabPatient` WHERE status = 'Active' """)
	return data

@frappe.whitelist()
def get_vaccine_type(doctype, txt, searchfield, start, page_len, filters):
    service = filters.get("custom_service_type")
    return frappe.db.sql('''select name,medication_class from `tabMedication Class` where custom_service_type = '{0}' '''.format(service))

def update_gender(doc, method):
	if doc.custom_patient_status:
		doc.status = doc.custom_patient_status
	# if doc.custom_gender:
		# doc.sex=  doc.custom_gender
	
	# update_phone_number(doc)

def set_questionnaire_template(self, method):
	appt = []
	for type in self.custom_event_services:
		if not frappe.db.get_value('Appointment Type Service Item',{"parent":type.vaccine_type,"dn":self.custom_service_unit}):
			appt.append(type.vaccine_type)
		ques = frappe.db.sql('''select parent from `tabQuestionnaires Vaccine Type` where vaccine_type = "{0}" order by creation desc limit 1'''.format(type.vaccine_type),as_dict = 1)
		if ques and "parent" in ques[0]:
			type.questionnaires_template = ques[0]["parent"]
	if len(appt):
		frappe.throw("No Service Unit is selected for the Appointments: {0}".format(", ".join(["<a href='/app/appointment-type/{0}'>{0}</a>".format(i,i) for i in appt])))

def update_phone_number(doc):
	company =  frappe.defaults.get_defaults().company
	format = frappe.db.get_value("Company", company, "custom_mobile_number_format")
	
	if format:
		if doc.mobile:
			doc.mobile = format_phone_number(doc.mobile, format)
		
def format_phone_number(phone_number, format):
	format_indexes = format.split("-")
	
	numeric_phone_number = ''.join(filter(str.isdigit, str(phone_number)))
	
	format_dig = format.replace("-", "")
	
	if len(format_dig) != len(numeric_phone_number):
		frappe.throw(f"Format for phone number: {format}", "Invalid Phone Number")
	
	c_index = len(format_indexes[0])
	
	country_code = numeric_phone_number[:c_index]
	
	formatted_phone_number = country_code
	
	for char in format_indexes[1:]:
		formatted_phone_number = formatted_phone_number + "-" + numeric_phone_number[c_index: (c_index+ len(char))]
		c_index += len(char)
	
	return formatted_phone_number
		
def validate(doc, method):
	pass

def get_default_compnay():
	if company:=frappe.defaults.get_global_default('company'):
		return company
	return "" 

@frappe.whitelist()
def recreational_drug_list():
	return {
		"drugs":frappe.get_list("Recreational Drug", order_by= "name", pluck="name") or [],
		"years": frappe.get_list("Year", pluck= "name") or []
	}
	
@frappe.whitelist()
def surgical_histories_list():
	return {
		"surgeries":frappe.get_list("", order_by= "name", pluck="name") or [],
		"years": frappe.get_list("Year", pluck= "name") or []
	}
	
@frappe.whitelist()
def relative_medical_conditions_list():
	return {
		"medical_condition":frappe.get_list("Medical Condition", order_by= "name", pluck="name") or [],
		"relatives": frappe.get_list("Relative", pluck= "name") or []
	}
	
# @frappe.whitelist()
# def get_environmental_question_list():
#     question = frappe.get_list("Environmental Question",["name", "question", "question_type"],  order_by= "name")
#     for quest in question:
#         if quest.get("question_type") == "Multiple Choice":
#             options = frappe.get_all("Environmental Answer",filters={"question": quest.get("name")} ,fields=["name", "answer"])
#             quest["options"] = options
			
#     if question:
#         return question
#     return []

@frappe.whitelist()
def attach_pdf(doc_name, doc_type, language= None):
	try:
		if doc_type == "CMR Service" and not language:
			frappe.msgprint("Please Select Language template for the patient summary")
			return 0
		origin = frappe.utils.get_url()
		default_print_format = "CMR Service - English" if language == "English" else "CMR Service - Spanish"
		if language is None:
			language = "English"
			default_print_format = frappe.get_value("Property Setter", 
                {
                    "doctype_or_field": "DocType", 
                    "doc_type": doc_type, 
                    "property": "default_print_format"
                    
                }, "value")
		if not default_print_format:
			frappe.msgprint("Please Set default print format for " + doc_type)
			return 0

		if not frappe.db.exists("Print Format", default_print_format):
			frappe.msgprint("Form Not Found", alert=1, indicator="green")
			return 0
		print_format_url = "/printview?doctype=" + doc_type + "&name=" + doc_name + "&format=" + (default_print_format or "standard")

		doc = frappe.new_doc("File")
		doc.file_name = cstr(language) + "-" + doc_name+"-"+frappe.utils.now()+".pdf"
		doc.attached_to_doctype = doc_type
		doc.attached_to_name = doc_name
		doc.is_private = 0
		doc.file_url = origin+print_format_url
		doc.save()
	except Exception as e:
		frappe.msgprint(print_format_url+"Attachment Failed" + str(e), alert=1, indicator="orange")
		return 0
	else:
		frappe.msgprint("Document Attached", alert=1, indicator="green")
		return doc.file_url
	
@frappe.whitelist()
def get_appointment_type(service_unit, appointment_type):
	return frappe.db.get_value("Appointment Type Service Item",{"parent":appointment_type, "dt":"Healthcare Service Unit", "dn":service_unit},"parent")

@frappe.whitelist()
def get_child_table_values(doctype, docname, table_name):
    doc = frappe.get_doc(doctype, docname)
    new_table=[]
    if table:= doc.get(table_name):
        for row in table:
            data = row.as_dict()
            data['name'] = ""
            new_table.append(data)
            
    return new_table

@frappe.whitelist()
def create_patient_appointment(doc):
	doc = json.loads(doc)
	if doc.get('doctype') == "CMR Service":
		appoint_ment = frappe.new_doc("Patient Appointment")
		appoint_ment.appointment_type = doc.get('custom_select_appointment_type')
		appoint_ment.appointment_for = "Service Unit"
		appoint_ment.service_unit = doc.get('custom_location_of_service')
		appoint_ment.appointment_date = today()
		appoint_ment.patient = doc.get('patient_name')
		appoint_ment.custom_service_type = doc.get("doctype")
		appoint_ment.custom_service_name = doc.get("name")
		appoint_ment.save(ignore_permissions = True)
		if doc.get("doctype") and doc.get("name"):
			frappe.db.set_value(doc.get("doctype"), doc.get("name"),  "patient_appointment",appoint_ment.name )
		return appoint_ment.name
	elif doc.get('doctype') == "Immunization Service":
		for type in doc.get("custom_select_appointment_type"):
			appoint_ment = frappe.new_doc("Patient Appointment")
			appoint_ment.appointment_type = type.get('appointment_type')
			appoint_ment.appointment_for = "Service Unit"
			appoint_ment.service_unit = doc.get('custom_location_of_service')
			appoint_ment.appointment_date = today()
			appoint_ment.patient = doc.get('patient_name')
			appoint_ment.custom_service_type = doc.get("doctype")
			appoint_ment.custom_service_name = doc.get("name")
			appoint_ment.save(ignore_permissions = True)



@frappe.whitelist()
def get_docdata_for_select(doctype = None):
	if not doctype:
		return False
	elig_temp = frappe.db.get_list("Patient Eligibility Template",{"service_type":doctype},["name","make_this_default"],order_by="creation")
	location = frappe.db.get_list("Healthcare Service Unit",{"is_group":0},order_by = "creation",pluck="name")
	appointment_type = frappe.db.get_list("Appointment Type",{"custom_service_type":doctype},order_by = "creation",pluck="name")
	return elig_temp,location,appointment_type
	