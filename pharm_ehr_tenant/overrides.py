import frappe,datetime
from frappe import _
from frappe.utils import flt, format_date, get_link_to_form, cint, urlencode, getdate, get_time
from healthcare.healthcare.doctype.patient_appointment.patient_appointment import PatientAppointment
from payments.payment_gateways.doctype.stripe_settings.stripe_settings import StripeSettings

class CustomPatientAppointment(PatientAppointment):
	def set_status(self):
		today = getdate()
		appointment_date = getdate(self.appointment_date)
		appointment_time = get_time(self.appointment_time)

		# If appointment is created for today set status as Open else Scheduled
		if appointment_date == today:
			if self.status not in ["Checked In", "Checked Out"]:
				self.status = "Open"
		if (appointment_time.hour != get_time(str(datetime.datetime.now().time()).split(".")[0]).hour) or (appointment_time.minute != get_time(str(datetime.datetime.now().time()).split(".")[0]).minute):
			if self.status not in ["Checked In", "Checked Out"]:
				self.status = "Scheduled"
		elif appointment_date > today:
			self.status = "Scheduled"

		elif appointment_date < today:
			if self.status == "Scheduled":
				self.status = "No Show"

	def before_save(self):
		if self.patient and self.appointment_type:
			self.title = frappe.db.get_value("Patient",self.patient,"first_name")+"'s "+self.appointment_type+" Appointment"
	def validate_based_on_appointments_for(self):
		if self.appointment_for:
			if self.appointment_for == "Practitioner":
				frappe.throw("Appointment Type - <b>{0}</b> is only allowed for booking Practitioner".format(self.appointment_type))
			# fieldname: practitioner / department / service_unit
			appointment_for_field = frappe.scrub(self.appointment_for)
			# validate if respective field is set
			if not self.get(appointment_for_field):
				frappe.throw(
					_("Please enter {}").format(frappe.bold(self.appointment_for)),
					frappe.MandatoryError,
				)

			if self.appointment_for == "Practitioner":
				# appointments for practitioner are validated separately,
				# based on practitioner schedule
				return

			# validate if patient already has an appointment for the day
			booked_appointment = frappe.db.exists(
				"Patient Appointment",
				{
					"patient": self.patient,
					"status": ["!=", "Cancelled"],
					appointment_for_field: self.get(appointment_for_field),
					"appointment_date": self.appointment_date,
					"name": ["!=", self.name],
					"appointment_time": self.appointment_time
				},
			)

			if booked_appointment:
				frappe.throw(
					_("Patient already has an appointment {} booked for {} on {}").format(
						get_link_to_form("Patient Appointment", booked_appointment),
						frappe.bold(self.get(appointment_for_field)),
						frappe.bold(format_date(self.appointment_date)),
					),
					frappe.DuplicateEntryError,
				)
	
class CustomStripeSettings(StripeSettings):
	def create_charge_on_stripe(self):
		print("\n\n\n\custom charge create\n\n\n\n\n")
		import stripe

		try:
			charge = stripe.Charge.create(
				amount=cint(flt(self.data.amount) * 100),
				currency=self.data.currency,
				source=self.data.stripe_token_id,
				description=self.data.description,
				receipt_email=self.data.payer_email,
			)

			if charge.captured == True:
				self.integration_request.db_set("status", "Completed", update_modified=False)
				self.flags.status_changed_to = "Completed"
				self.integration_request.handle_success(charge)

			else:
				frappe.log_error(charge.failure_message, "Stripe Payment not completed")
				self.integration_request.handle_failure(charge)
				
		except Exception:
			frappe.log_error(frappe.get_traceback())

		return self.finalize_request()

	def finalize_request(self):
		print("\n\n\n\n\nfinalize custom\n\n\n\n")
		redirect_to = self.data.get("redirect_to") or None
		redirect_message = self.data.get("redirect_message") or None
		status = self.integration_request.status

		if self.flags.status_changed_to == "Completed":
			if self.data.reference_doctype and self.data.reference_docname:
				custom_redirect_to = None
				try:
					custom_redirect_to = frappe.get_doc(
						self.data.reference_doctype, self.data.reference_docname
					).run_method("set_as_paid")
				except Exception:
					frappe.log_error(frappe.get_traceback())

				if custom_redirect_to:
					redirect_to = custom_redirect_to

				redirect_url = "payment-success?doctype={}&docname={}".format(
					self.data.reference_doctype, self.data.reference_docname
				)

			if self.redirect_url:
				redirect_url = self.redirect_url
				redirect_to = None
		else:
			redirect_url = "payment-failed"

		# if redirect_to:
		# 	redirect_url += "?" + urlencode({"redirect_to": redirect_to})
		if redirect_message:
			redirect_url += "&" + urlencode({"redirect_message": redirect_message})
		return {"redirect_to": redirect_url, "status": status}
