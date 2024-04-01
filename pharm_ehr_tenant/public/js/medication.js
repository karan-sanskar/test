frappe.ui.form.on("Medication", {
    setup:function(frm){
        frm.set_query("custom_service_type", function (frm) {
            return {
                filters: {
                    module:"Service Type"
                }
            };
        });
    }
})
