# Copyright (c) 2024, Aerele and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ChooseVaccineType(Document):
	pass

@frappe.whitelist()
def get_vaccine_types():
	return frappe.db.get_list("Vaccine Type",pluck="name")