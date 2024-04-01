# Copyright (c) 2024, Aerele and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import cint, cstr, flt, formatdate, getdate, now




class Year(Document):
	def validate(self):
		pass
		
		

def create_default_years():
	try:
		print("Defaults years Creating...")
		for year in range(1950, getdate().year+1):
			if not frappe.db.exists("Year", cstr(year)):
				doc = frappe.get_doc({"doctype": "Year", "year": cstr(year)})
				doc.insert()
	except Exception as e:
		print(e)
	else:
		print("Success fully years created...")
		
	 
			
			
	  
