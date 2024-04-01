# Copyright (c) 2024, Aerele and contributors
# For license information, please see license.txt

import json
import math
import frappe
from frappe.model.document import Document
from frappe.utils import today,nowtime,cint,cstr,getdate

from datetime import datetime

from frappe.utils.data import flt

class CMRService(Document):
	def autoname(self):
		if frappe.db.get_value("Appointment Type", self.custom_select_appointment_type, "custom_default_followup"):
			self.name = self.old_name

	def before_save(self):
		self.update_vital_signs()

	def validate(self):
		if not self.patient_eligibility_template:
			self.patient_eligibility_template = frappe.db.get_value("Patient Eligibility Template",{"service_type":"CMR Service","make_this_default":1})
		patient_doc = frappe.get_doc("Patient",self.patient_name)
  
		history_field_list = [
			"do_you_currently_use_or_have_you_ever_tobacco_profucts",
			"current_cigarette_smoker",
			"when_did_you_first_start_smoking",
			"how_many_cigarettes_do_you_smoke_per_day",
			"are_you_interested_in_quiting_1",
			"former_cigarette_smoker",
			"when_did_you_quit_smoking",
			"on_average_how_many_cigarettes_did_you_smoke_per_day",
			"how_many_years_did_you_smoke_for",
			"other_tobacco_user",
			"other_description",
			"how_many_times_in_the_past_year",
			"are_you_interested_in_quiting_2",
			"past_year_have_you_had_4_or_more_alcoholic_drinks_iady",
			"recreational_drug_usage-table",
			"use_opioids_and_have_access_to_nacran",
			"are_you_interesting_in_quiting",
			"relative_medical_conditions-table",
			"surgical_histories-table",
			"purpose_of_body_shapping",
			"have_you_hospitalized_overnight",
			"what_for_and_when",
			"employment_housing_transportation-table"
		]
  
		for field in history_field_list:
			if '-table' not in field:
				if self.get(field):
					patient_doc.set('custom_'+field,  self.get(field))
			else:
				field = field.split('-table')[0]
				patient_doc.set('custom_'+field, [])
				t_list = []
				for row in self.get(field):
					row = row.as_dict()
					row.pop('name')
					t_list.append(row)
				patient_doc.extend('custom_'+field,  t_list)


		health_conditions = {}

		for data in patient_doc.custom_health_conditions:
			health_conditions[data.health_condition] = data.condition_status

		for cond in self.health_conditions:
			if cond.health_condition not in health_conditions:
				patient_doc.append("custom_health_conditions",{
					"health_condition":cond.health_condition,
					"condition_status":cond.condition_status
				})

		allergies = {}
		for data in patient_doc.custom_drug_allergies__side_effects:
			allergies[data.allergies] = data.reaction

		for cond in self.allergies_side_effects:
			if cond.allergies not in allergies:
				patient_doc.append("custom_drug_allergies__side_effects",{
					"allergies":cond.allergies,
					"reaction":cond.reaction
				})
		medications = {}
		for data in patient_doc.custom_medications:
			medications[data.medication_name] = {"name":data.name,"prescriber":data.prescriber,"directions":data.directions,"related_conditions":data.related_conditions,"potential_problem":data.potential_problem}

		is_empty = not self.medication_action_plan
		for cond in self.medications:
			if cond.medication_name not in medications:
				if is_empty:
					self.append("medication_action_plan",{"medication":cond.medication_name})

				patient_doc.append("custom_medications",{
					"medication_name":cond.medication_name,
					"prescriber":cond.prescriber,
					"directions":cond.directions,
					"related_conditions":cond.related_conditions,
					"potential_problem":cond.potential_problem
				})
			else:
				if is_empty:
					self.append("medication_action_plan",{"medication":cond.medication_name})

				if (not medications[cond.medication_name]["directions"] == cond.directions) or (not medications[cond.medication_name]["prescriber"] == cond.prescriber) or (not medications[cond.medication_name]["related_conditions"] == cond.related_conditions) or (not medications[cond.medication_name]["potential_problem"] == cond.potential_problem):
					patient_doc.append("custom_medications",{
						"medication_name":cond.medication_name,
						"prescriber":cond.prescriber,
						"directions":cond.directions,
						"related_conditions":cond.related_conditions,
						"potential_problem":cond.potential_problem
					})
		# 	medication += str(cond.idx)+". "+cond.medication_name+" - "+cond.directions+" - "+cond.related_conditions+" - "+cond.potential_problem+"\n"


		patient_doc.save(ignore_permissions = True)
  

		if self.patient_eligibility_template and self.get_doc_before_save() and self.workflow_state in ["Not Started","Qualified","Ineligible"]:
			self.update_eligibility()

		if self.get_doc_before_save() and self.workflow_state == "Ready for Service":
			self.update_summary_details()
		if not is_empty and self.get_doc_before_save():
			self.validate_medication_action_plan()
		if self.workflow_state == "Ineligible":
			self.db_set("ineligible_date",today())
		if (not self.workflow_state == "Ineligible") and self.ineligible_date and (not self.justify_ineligibility):
			frappe.throw("Justification for Ineligibility is necessary")

		if self.workflow_state == "Ready for Service":
			self.update_service_start_time()

		if self.workflow_state == "Ready for Service":
			self.update_service_end_time()
			self.update_service_duration(is_save = True)
			self.set_billing_in_appointment()

	def set_billing_in_appointment(self):
		if self.patient_appointment:
			doc = frappe.get_doc("Patient Appointment", self.patient_appointment)
			doc.custom_service_start_time = self.service_start_time
			doc.custom_service_end_time = self.service_end_time
			doc.custom_total_service_durationin_minutes = self.total_duration
			doc.custom_payment_type = self.payment_type
			doc.custom_billing_status = self.billing_status
			doc.custom_billing_code = []
			for row in self.billing_code:
				doc.append("custom_billing_code",{
					"item_code":row.item_code,
					"appointment_type":row.appointment_type
				})
			doc.save()


	def validate_medication_action_plan(self):
			medication_action_list = [med.medication for med in self.medication_action_plan]
			medication_list =  [ med.medication_name for med in  self.medications]

			if self.medications and self.medication_action_plan:
				if self.workflow_state == "Qualified":
					self.medication_action_plan = []
					for med in self.medications:
						self.append("medication_action_plan", {"medication": med.medication_name})
					return
				else:
					new_medication = []
					new_medication_action = []
					
					for med in self.medication_action_plan:
						if med.medication not in medication_list:
							new_medication_action.append({"medication_name": med.medication})

					medication_action_list = [med.medication for med in self.medication_action_plan]
	  
					for med in new_medication_action:
						self.append("medications", med)
	  
					for med in self.medications:
						if med.medication_name not in medication_action_list:
							self.medications.remove(med)

					return
			
	@frappe.whitelist()
	def get_patient_address(self):
		address = frappe.db.sql("""
				SELECT a.name AS address
					FROM `tabAddress`a LEFT JOIN `tabDynamic Link`dl
					ON a.name = dl.parent
				WHERE dl.link_doctype = 'Patient' AND dl.link_name = '{}'""".format(self.patient_name),
				as_dict= 1)

		if address:
			return address[0]
		return []



	def on_update_after_submit(self):
		self.update_service_duration(is_save=False)
		self.set_billing_in_appointment()
	def on_update(self):
		pass
	
	def before_submit(self):
		if self.patient_appointment:
			frappe.db.set_value("Patient Appointment",self.patient_appointment,"status","Completed")
	# 	self.update_summary_details()

	def update_summary_details(self):
		self.date_cmr_was_completed = today()
		self.pharmacists_availability_for_questions = "Monday to Friday 8am - 5pm"
		self.verify_patients_name_and_address = """{} <br> {}""".format(frappe.bold(frappe.db.get_value("Patient",self.patient_name,"patient_name")), self.address_html)

	def update_service_start_time(self):
		if not self.service_start_time:
			self.db_set("service_start_time", frappe.utils.now())

	def update_service_end_time(self):
		if not self.service_end_time:
			self.db_set("service_end_time" , frappe.utils.now())

	def update_service_duration(self, is_save=False):
		date_format = "%Y-%m-%d %H:%M:%S"

		str_start_time = frappe.utils.get_datetime_str(self.service_start_time).split('.')[0]
		str_end_time = frappe.utils.get_datetime_str(self.service_end_time).split('.')[0]


		start_time = datetime.strptime(str_start_time, date_format)
		end_time = datetime.strptime(str_end_time, date_format)

		time_difference =  end_time - start_time

		# hours, remainder = divmod(time_difference.seconds, 3600)
		# minutes, seconds = divmod(remainder, 60)
		if not self.total_duration:
			self.db_set("total_duration", str(time_difference.total_seconds()/60))

		if self.total_duration and self.payment_type == "Insurance":

			max_duration = 60
			total_duration = max_duration if flt(self.total_duration) > max_duration else flt(self.total_duration)
			std_duration = 15

			no_of_rows = math.ceil(total_duration / 15 )
			print(no_of_rows,"no of rows\n\n\n")
			self.billing_code = []
			frappe.db.sql('''delete from `tabBilling Code` where parent = '{0}' '''.format(self.name))
			frappe.db.commit()
			for row in range(1, no_of_rows+1):

				sloat = row * std_duration
				
				print(row,sloat-std_duration, sloat)
				# if row == 1:
				# item  = self.get_item("15")
				# if not item: continue
				# medical_codes = frappe.db.get_list('Codification Table',{'parent':self.custom_select_appointment_type},["code_system","code_value","code"])
				medical_codes = frappe.db.sql('''select code_system, code_value, code,idx from `tabCodification Table` where parent = '{0}' order by idx'''.format(self.custom_select_appointment_type),as_dict = 1)
				pattern = "({} - {})".format(sloat-std_duration, sloat)
				
				# self.billing_code = []
				for code in medical_codes:
					code = frappe._dict(code)
					if code.code == pattern:
						if is_save:
							self.append("billing_code",
							{
								"item_code": code.code_value,
								"item_name": code.code,
							})
						else:
							self.append("billing_code",
							{
								"idx":row,
								"item_code": code.code_value,
								"item_name": code.code,
							})
							frappe.get_doc({
								"id": row,
								"doctype": "Billing Code",
								"item_code": code.code_value,
								"item_name":  code.code,
								"parent": self.name,
								"parentfield": "billing_code",
								"parenttype": "CMR Service"
							}).save()
						
				# else:
				# 	item  = self.get_item("+15")
				# 	if not item: continue
				# 	self.append("billing_code",
				#  	{
				# 		"idx": row,
				# 		"doctype": "Billing Code",
				# 		"item_code": item.get("item_code"),
				# 		"item_name":  "  ({} - {})".format(sloat-std_duration, sloat),
				# 	})
					# frappe.get_doc({
					# 	"idx": row,
					# 	"doctype": "Billing Code",
					# 	"item_code": item.get("item_code"),
					# 	"item_name": "  ({} - {})".format(sloat-std_duration, sloat),
					# 	"parent": self.name,
					# 	"parentfield": "billing_code",
					# 	"parenttype": "CMR Service"
					# }).save()

	def get_item(self, duration):
		item_group = "CMR Service"
		data = frappe.db.sql("""
					SELECT name, item_name, item_code, item_group, custom_duration
					FROM `tabItem`
					WHERE item_group = '{}' AND custom_duration LIKE '{}%'"""
					.format(item_group, duration), as_dict = True)
		if data:
			return data[0]
		return []

	def get_items(self):
		minutes = float(self.total_duration)
		if not minutes:
			minutes = 1
		duration = math.ceil( minutes/15 )  * 15
		data = frappe.db.sql("""
					SELECT name, item_name, item_code, item_group, custom_duration
					FROM `tabItem`
					WHERE item_group = '{}' AND custom_duration <= '{}' """
					.format("CMR Service" , duration) , as_dict= 1)
		return data

	def update_vital_signs(self):
		if self.patient_name:
			exists = frappe.db.exists("Vital Signs", {
						   "patient" : self.patient_name,
						"signs_date": self.signs_date ,
						"signs_time": self.signs_time})

			if not exists:
				new_doc = frappe.new_doc("Vital Signs")
				new_doc.patient = self.patient_name
				new_doc.pulse = self.pulse
				new_doc.height = self.height
				new_doc.weight = self.weight
				new_doc.bmi = self.bmi
				new_doc.bp_systolic = self.bp_systolic
				new_doc.bp_diastolic = self.bp_diastolic
				new_doc.signs_date = self.signs_date
				new_doc.signs_time = self.signs_time
				new_doc.save()

			else:
				old_doc = frappe.get_doc("Vital Signs", exists)
				old_doc.pulse = self.pulse
				old_doc.height = self.height
				old_doc.weight = self.weight
				old_doc.bmi = self.bmi
				old_doc.bp_systolic = self.bp_systolic
				old_doc.bp_diastolic = self.bp_diastolic
				old_doc.save()

			if not exists:frappe.msgprint("Vital Signs Updated.", alert=1, indicator="green")

	def update_eligibility(self):
		checked = []
		for row in self.eligibility:
			if row.criteria:
				val = int(row.criteria.split("_")[1].replace(" ",""))
				checked.append(val)

		template = self.patient_eligibility_template
		if not template:
			frappe.throw("Before moving on to the next step, choose the Service Provider Form.", title="Mandatory value")
		doc = frappe.get_doc("Patient Eligibility Template",template)
		cond_list = []
		and_cond = doc.code_etoe.split("OR") if doc.code_etoe else []
		for data in and_cond:
			cond_list.append(data.replace("(","").replace(")","").replace(" ","").split("AND"))
		f = 0
		for cond in cond_list:
			count = 0
			for check in checked:
				val = "criteria_"+str(check)
				for cond_str in cond:
					if val in cond_str:
						count += 1
						break
			if count == len(cond):
				f = 1
				self.workflow_state = "Qualified"
				break
		if not f:
			if self.eligibility:
				self.workflow_state = "Ineligible"

@frappe.whitelist()
def get_default_medications(doctype):
	return frappe.db.get_all("Medication Services",{"parenttype":"Medication","service_name":doctype},"parent")

@frappe.whitelist()
def get_eligibility_criteria(service_type, service_name ):
	criterias = frappe.db.sql(f"""
		SELECT
			ecc.criteria, ecc.yes_or_no
		FROM `tabEligibility Check for CMR`ecc LEFT JOIN `tabEligibility Form`ef
		ON ecc.parent = ef.name WHERE ef.service_type= '{service_type}' AND ef.service_name='{service_name}'""", as_dict=1)

	if criterias:
		return criterias

	return []

@frappe.whitelist()
def get_patient_appointments(patient,doctype,docname,appointment_type ,location,patient_appointment):
	if not patient: return []
	filters = ""
	if patient_appointment:
		filters += "and name = '{0}' ".format(patient_appointment)

	appoint_ments = frappe.db.sql("""Select
		name ,practitioner, practitioner_name,service_unit, appointment_date as date, appointment_type,
		appointment_time as time, status, event from `tabPatient Appointment`
		where patient= '{}' and status not in ('Cancelled', 'Closed') and service_unit = '{}' {} order by appointment_date desc,appointment_time desc""".format(
		patient,location,filters), as_dict=1)
	return {
		"column": appoint_ments or [],
		"column2": [],
	}

@frappe.whitelist()
def create_patient_appointment(args):
	args = json.loads(args)
	new_cmr = ""
	if frappe.db.get_value("Appointment Type",args.get('is_new'),"custom_default_followup"):
		new_cmr = create_follow_up_appointment(args.get('docname'),args.get('is_new'))
	appoint_ment = frappe.new_doc("Patient Appointment")
	appoint_ment.appointment_type = args.get('appointment_type')
	appoint_ment.appointment_for = "Service Unit"
	# appoint_ment.practitioner = args.get('practitioner')
	appoint_ment.service_unit = args.get('service_unit')
	appoint_ment.appointment_date = args.get('appointment_date')
	appoint_ment.patient = args.get('patient')
	appoint_ment.custom_service_type = args.get("doctype")
	appoint_ment.custom_service_name = new_cmr if new_cmr else args.get("docname") 
	# appoint_ment.appointment_time = args.get('appointment_time')
	appoint_ment.save()
	if args.get("doctype") and args.get("docname"):
		frappe.db.set_value(args.get("doctype"), args.get("docname"),  "pharmacist", args.get('practitioner'))
	if frappe.db.get_value("Appointment Type",args.get('is_new'),"custom_default_followup") and new_cmr:
		frappe.db.set_value(args.get("doctype"), new_cmr,  "patient_appointment", appoint_ment.name)
	frappe.msgprint("Appointment Scheduled against CMR Service - <a href='/app/cmr-service/{0}' >{0}</a>".format(new_cmr), title= "")

@frappe.whitelist()
def create_follow_up_appointment(docname,app_type):
	old_doc=  frappe.get_doc("CMR Service", docname)
	doc = frappe.copy_doc(old_doc)
	new_name = old_doc.name+ "-" + cstr(frappe.db.count("CMR Service", {"reference_document": docname}) + 1)
	field_list = [
    "signs_date",
    "pulse",
    "height",
    "weight",
    "bmi",
    "signs_time",
    "bp_systolic",
    "bp_diastolic",
    "bp",
    "bmi_note",
    "medication_action_plan -t",
    "my_follow_up_plan",
    "questions",
    "date_cmr_was_completed",
    "ltc",
    "language",
    "patient_summary_date",
    "pharmacists_availability_for_questions",
    "verify_patients_name_and_address",
    "additional_notes_summary",
    "agreement",
    "agreement_html",
    "service_start_time",
    "service_end_time",
    "total_duration",
    "payment_type",
    "billing_status",
    "billing_code -t",
    "workflow_progress",
    "workflow_state"
]
	for field in field_list:
		if field.endswith('-t'):
			doc.update({field.replace('-t', '').strip(): []})
		doc.update({field.replace('-t', '').strip(): ""})
	doc.update(
		{	"old_name": new_name,
			"signs_date": today(),
			"signs_time" :nowtime(),
			"custom_select_appointment_type": app_type,
			"reference_document":docname
		}
	)
	print({	"old_name": new_name,
			"signs_date": today(),
			"signs_time" :nowtime(),
			"custom_select_appointment_type": app_type,
			"reference_document":docname
		})
	doc.save()
	frappe.db.set_value(doc.doctype, doc.name, "workflow_state", "Scheduled")

	return doc.name

@frappe.whitelist()
def save_date_and_time(appointment,date,time):
	if not appointment:
		return False
	doc = frappe.get_doc("Patient Appointment",appointment)
	doc.appointment_date = getdate(date)
	doc.appointment_time = time
	doc.save(ignore_permissions = True)
	return doc.name
