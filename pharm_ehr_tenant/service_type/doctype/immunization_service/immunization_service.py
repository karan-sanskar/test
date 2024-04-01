# Copyright (c) 2024, Aerele and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils.html_utils import clean_html
from frappe.utils import cstr, strip_html
from datetime import datetime

from frappe.utils.data import flt




class ImmunizationService(Document):
	def validate(self):
		self.patient_address = self.get_patient_address() or ""
		
	@frappe.whitelist()
	def get_patient_address(self):
		address = frappe.db.sql("""
				SELECT a.name AS address 
					FROM `tabAddress`a LEFT JOIN `tabDynamic Link`dl 
					ON a.name = dl.parent 
				WHERE dl.link_doctype = 'Patient' AND dl.link_name = '{}'""".format(self.patient_name),
				as_dict= 1)
		if len(address):
			return address[0]
		return []
	def on_update(self):
		if self.service_start_time and self.service_end_time:
			self.update_service_duration()
		if self.patient_name and not self.billing_code:
			billing_items = frappe.db.sql('''select ati.op_consulting_charge_item as item_code, ati.parent as appointment_type from `tabAppointment Type Service Item` as ati join `tabQuestionnaires Response` as q on q.vaccine_type = ati.parent where q.form_type = "Immunization Service" and q.patient_name = '{0}' '''.format(self.patient_name),as_dict = 1)
			for item in billing_items:
				self.append("billing_code",item)
	def update_service_start_time(self):
		if not self.service_start_time:
			self.db_set("service_start_time", frappe.utils.now())

	def update_service_end_time(self):
		if not self.service_end_time:
			self.db_set("service_end_time" , frappe.utils.now())

	def update_service_duration(self):
		date_format = "%Y-%m-%d %H:%M:%S"

		str_start_time = frappe.utils.get_datetime_str(self.service_start_time).split('.')[0]
		str_end_time = frappe.utils.get_datetime_str(self.service_end_time).split('.')[0]
		start_time = datetime.strptime(str_start_time, date_format)
		end_time = datetime.strptime(str_end_time, date_format)
		time_difference =  end_time - start_time
		self.db_set("total_service_durationin_minutes", str(time_difference.total_seconds()/60))
		# hours, remainder = divmod(time_difference.seconds, 3600)
		# minutes, seconds = divmod(remainder, 60)
		# if not self.total_service_durationin_minutes:
		

@frappe.whitelist()
def get_all_vaccine_questionnaire(patient, service_type, template):
	if template:
		vaccine_details = frappe.db.sql('''select qd.question_no as q_id, qd.idx as id,q.question as question from `tabQuestions Description` as qd join `tabQuestion Doctype` as q on q.name = qd.question_no where qd.parent = '{0}' order by qd.idx'''.format(template),as_dict = 1)
		return vaccine_details
	else:
		vaccine_details = frappe.db.sql('''select q.vaccine_type as vaccine_type,mc.idx as idx,mc.question as description,mc.yes as yes,mc.no as no,mc.na as na from `tabMulti Check Type Questions` as mc join `tabQuestionnaires Response` as q on q.name=mc.parent where q.patient_name='{0}' and q.form_type='{1}' order by q.vaccine_type,mc.idx '''.format(patient,service_type),as_dict = 1)
		res = {}
		for data in vaccine_details:
			if data["vaccine_type"] not in res:
				res[data["vaccine_type"]] = [{"desc":str(data["idx"])+". "+strip_html(data["description"]),"yes":data["yes"],"no":data["no"],"na":data["na"]}]
			else:
				res[data["vaccine_type"]].append({"desc":str(data["idx"])+". "+strip_html(data["description"]),"yes":data["yes"],"no":data["no"],"na":data["na"]})
		return res
	
@frappe.whitelist()
def get_patient_appointments(doctype,docname):
	appoint_ments = frappe.db.sql("""Select
		name ,practitioner, practitioner_name,service_unit, appointment_date as date, appointment_type,
		appointment_time as time, status, event from `tabPatient Appointment`
		where custom_service_type='{}' and custom_service_name = '{}' and status not in ('Cancelled', 'Closed') order by appointment_date desc,appointment_time desc""".format(
		doctype,docname), as_dict=1)
	return {
		"column": appoint_ments or [],
		"column2": [],
	}