# Copyright (c) 2024, Aerele and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class EligibilityForm(Document):
	def validate(self):
		checked = []
		for row in self.eligibility:
			if row.criteria:
				val = int(row.criteria.split(".")[0].replace(" ",""))
				checked.append(val)
		template = frappe.db.get_value(self.service_type,self.service_name,"patient_eligibility_template")
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
						print(count)
						break
			if count == len(cond):
				f = 1
				print("qualified")
				cmr_doc = frappe.get_doc(self.service_type,self.service_name)
				cmr_doc.workflow_state = "Qualified"
				cmr_doc.save(ignore_permissions = True)
				# frappe.db.set_value(self.service_type,self.service_name,"workflow_state","Qualified")
				break
		if not f:
			print("not elig")
			cmr_doc = frappe.get_doc(self.service_type,self.service_name)
			cmr_doc.workflow_state = "Ineligible"
			cmr_doc.save(ignore_permissions = True)
			# frappe.db.set_value(self.service_type,self.service_name,"workflow_state","Ineligible")
