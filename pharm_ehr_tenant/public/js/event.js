frappe.ui.form.on('Event', {
    all_day: function(frm){
        let val = cur_frm.doc.all_day
        frm.set_value({
            "monday": val,
            "tuesday": val,
            "wednesday": val,
            "thursday": val,
            "friday": val,
            "saturday": val,
            "sunday": val
        })
    },
    refresh:function(frm){
        if(frm.doc.__islocal){
            frm.set_value("all_day", 0)
        }
        frm.set_value("send_reminder", 0)
        $(`[data-label="Participants"]`).hide()

        setTimeout(() => {

            frm.remove_custom_button("Add Contacts","Add Participants");
            frm.remove_custom_button("Add Leads","Add Participants");
            frm.remove_custom_button("Add Customers","Add Participants");
            frm.remove_custom_button("Add Suppliers","Add Participants");
            frm.remove_custom_button("Add Employees","Add Participants");
            frm.remove_custom_button("Add Sales Partners","Add Participants");
            frm.remove_custom_button("Add Sales Partners");

          }, 500);
       		// frm.add_custom_button(
			// __("Add Practitioner"),
			// function () {
			// 	new frappe.desk.eventParticipants(frm, "Healthcare Practitioner");
			// },
			// __("Add Participants")
		// );
        // frm.add_custom_button(
		// 	__("Add Services"),function(){
        //         frappe.prompt(
        //             [
        //             {
        //                 label: __("Service Type"),
        //                 fieldname: "medication",
        //                 fieldtype: "Link",
        //                 options: "DocType",
        //                 get_query: function() {
        //                     return {
        //                         filters: [

        //                             [
        //                                 "DocType",
        //                                 "module",
        //                                 "=",
        //                                 "Service Type"
        //                             ]
        //                         ],

        //                     };
        //                 },
        //                 reqd: 1  // Make the field required if necessary
        //             },
        //             {
        //                 label: __("Service Unit"),
        //                 fieldname: "service_unit",
        //                 fieldtype: "Link",
        //                 options: "Healthcare Service Unit",
        //                 get_query: function() {
        //                     return {
        //                         filters: [

        //                             [
        //                                 "Healthcare Service Unit",
        //                                 "is_group",
        //                                 "=",
        //                                 0
        //                             ],
        //                             [
        //                                 "Healthcare Service Unit",
        //                                 "allow_appointments",
        //                                 "=",
        //                                 1
        //                             ]
        //                         ],

        //                     };
        //                 },
        //                 reqd: 1  // Make the field required if necessary
        //             }

        //         ],(values) => {
        //            frm.set_value("custom_service_unit",values.service_unit)
        //             frappe.db.get_list('Appointment Type',{filters: {"custom_service_type":values.medication}, fields:['name']}).then((res) => {

        //                 res.forEach((d) => {
        //                     frappe.call({
        //                         method: 'pharm_ehr_tenant.pharm_ehr_tenant.utils.get_appointment_type',
        //                         args: {
        //                             "service_unit": values.service_unit,
        //                             "appointment_type":d.name
        //                         },
        //                         callback: function(r,values) {
        //                             if(r.message){
        //                                 var cd = frm.add_child("custom_event_services")
        //                                 cd.service_type = values.medication
        //                                 cd.vaccine_type = r.message
        //                                 frm.refresh_field("custom_event_services")
        //                             }

        //                         }
        //                     });

        //                 })

        //             })
        //         },"Services","Add Service")

        //     }).addClass('btn btn-primary');
            frm.add_custom_button(
                __("Event Registration Link"),function(){
                    let location = `${window.location.origin}/webform/?event=`+frm.doc.name
                    window.open(location, "_blank")
                })
    },
    setup:function(frm){
        frm.set_query("service_type", "custom_event_services", function (frm) {
			return {
				filters:
					{
						"module":"Service Type",
					}
			};
        });
        frm.fields_dict["custom_event_services"].grid.get_field('vaccine_type').get_query = function(doc, cdt, cdn){
            var row = locals[cdt][cdn];
            return {
                // query: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_vaccine_type",
				filters:
					{
						"name":["not in", doc.custom_event_services.map((ele)=>{return  ele.vaccine_type})],
                        "custom_service_type": ["!=", ""]
					}
			};
        }
        // frm.fields_dict["custom_event_services"].grid.get_field('vaccine_name').get_query = function(doc, cdt, cdn){
        //     var row = locals[cdt][cdn];
        //     return {
        //         // query: "pharm_ehr_tenant.pharm_ehr_tenant.utils.get_vaccine_type",
		// 		filters:
		// 			{
		// 				"medication_class":row.vaccine_type
		// 			}
		// 	};
        // }
    },
})

frappe.ui.form.on('Event Services', {
    vaccine_type: function(frm, cdt, cdn){
    let row = locals[cdt][cdn]
    frappe.call({
        method:"pharm_ehr_tenant.api.get_appointment_questionnaires",
        args:{
            docname:row.vaccine_type
        },
        callback: (r) => {
            let htmlField = `<label class='control-label'g>Questionnaires Template</label>`
            if (r.template.length) {
                for (let template of r.template){
                    htmlField += `<div class= 'mb-2'><button class='btn btn-xs btn-default'><a href='/app/questionnaires-template/${template}'>${template}</a></button></div>`
                }
            }
            frm.fields_dict.custom_event_services.grid.update_docfield_property("questionnaires_template","options",htmlField)
        }
    })
    }
    })



