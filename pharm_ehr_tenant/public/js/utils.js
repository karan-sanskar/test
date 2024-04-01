frappe.provide("erpnext");

erpnext.utils.PatientAppointment = class PatientAppointment {
    constructor(opts) {
        
            $.extend(this, opts);
        }
    
        refresh() {
            var me = this;
            $(this.open_appointments).empty();
            
            if (this.frm.doc.patient_name && this.frm.doc.custom_location_of_service) {
                frappe.call({
                    method: "pharm_ehr_tenant.service_type.doctype.cmr_service.cmr_service.get_patient_appointments",
                    args: {
                        patient: this.frm.doc.patient_name,
                        doctype: this.frm.doc.doctype,
                        docname: this.frm.doc.name,
                        appointment_type: this.frm.doc.appointment_type? this.frm.doc.appointment_type : "",
                        location:this.frm.doc.custom_location_of_service || "",
                        patient_appointment:this.frm.doc.patient_appointment || ""

                    },
                    callback: (r) => {
                        if (!r.exc) {
                            var appointment_html = frappe.render_template('appointment', {
                                column: r.message.column,
                                column2: r.message.column2
                            });
        
                            $(appointment_html).appendTo(me.open_appointments);
    
                            me.create_appointment();
                        }
                    }
                });
            }
        }
        
        create_appointment () {
            let me = this;
            let _create_appointment = () => {
                const args = {
                    doc: me.frm.doc,
                    frm: me.frm,
                    title: __("New Appointment")
                };
                let composer = me.check_and_set_availability(me.frm)

            };
            let _edit_date_and_time = (event) => {
                debugger
                console.log(event.target)
                var d = new frappe.ui.Dialog({
                    title: __("Edit Date and Time"),
                    fields: [
                        {
                            label: "Appointment Date",
                            fieldname: "date",
                            fieldtype: "Date",
                            default: $(".edit-date-and-time").attr('data-date'),
                        },
                        {
                            label: "Appointment Time",
                            fieldname: "time",
                            fieldtype: "Time",
                            default: $(".edit-date-and-time").attr('data-time'),
                        },
                    ],
                    primary_action: function () {
                        var data = d.get_values();
                        frappe.call({
                            method: "pharm_ehr_tenant.service_type.doctype.cmr_service.cmr_service.save_date_and_time",
                            args: {
                               appointment : $(".edit-date-and-time").val() || "",
                               date:data.date,
                               time:data.time
                            },
                            callback: (r) => {
                                frappe.run_serially([
                                    ()=>  me.frm.trigger("show_appointment"),
                                    ()=>  me.frm.save(),
                                    // ()=>  window.location.reload(),
                                    ]
                                )
                                d.hide()
                               
                               
                               
                                
                            }
                        })
                        
                        
                    },
                    primary_action_label: __("Save"),
                });
                d.show();
            }
            $(".new-appointment-btn").click(_create_appointment);
            $(".edit-date-and-time").click(_edit_date_and_time);
        }
};
