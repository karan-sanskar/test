frappe.ui.form.on('Sales Invoice', {
	refresh(frm) {
		frm.set_query("custom_service_type", (frm)=>{
            return {
	            filters: {"module": "Service Type", "istable": 0}
	        }
        })
	}
})