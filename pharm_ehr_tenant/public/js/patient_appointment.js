frappe.ui.form.on("Patient Appointment", {
    refresh:function(frm){
        frm.set_query("custom_service_type", function (frm) {
			return {
				filters: 
					{
						"module":"Service Type",
						// "duration": cur_frm.doc.total_duration
					}
			};
		});
        if(frm.doc.status == "Open"){
            frm.page.set_indicator(__("Draft"), "red")

        }
        else if(frm.doc.status == "Scheduled"){
            frm.page.set_indicator(__("Scheduled"), "yellow")
        }
        else if(frm.doc.status == "Closed"){
            frm.page.set_indicator(__("Closed"), "green")
        }
        frm.remove_custom_button("Reschedule")
        frm.remove_custom_button("Patient Encounter","Create")
        frm.remove_custom_button("Vital Signs","Create")
        if(frm.doc.custom_service_type){
            cur_frm.add_custom_button(__(frm.doc.custom_service_type), function () {
                frappe.set_route("Form",frm.doc.custom_service_type,frm.doc.custom_service_name)
            },"View")
        }
        if(frm.doc.status == "Open"){
            cur_frm.add_custom_button(__("Appointment Date and Time"), function () {
                var d = new frappe.ui.Dialog({
                    title: __("Edit Date and Time"),
                    fields: [
                        {
                            label: "Appointment Date",
                            fieldname: "date",
                            fieldtype: "Date",
                            default: frm.doc.appointment_date,
                        },
                        {
                            label: "Appointment Time",
                            fieldname: "time",
                            fieldtype: "Time",
                            default: frm.doc.appointment_time,
                        },
                    ],
                    primary_action: function () {
                        var data = d.get_values();
                        frm.set_value("appointment_date",data.date)
                        frm.set_value("appointment_time",data.time)
                        frm.refresh_fields()
                        frm.save()
                        d.hide()
                    },
                    primary_action_label: __("Edit"),
                });
                d.show();
            },"Edit")
        }
       
    }
})