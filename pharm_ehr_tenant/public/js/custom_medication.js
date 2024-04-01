frappe.ui.form.on('Medication', {
    refresh: function(frm){
       cur_frm.fields_dict['custom_services'].grid.get_field("service_name").get_query = function(doc) {
            return {
	            filters: {"module": "Service Type", "istable": 0}
	        }
    }
    }
});