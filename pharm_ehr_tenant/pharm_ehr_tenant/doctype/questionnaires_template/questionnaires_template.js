// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt

frappe.ui.form.on("Questionnaires Template", {
    refresh:function(frm){
        frm.set_query("question_no", "questions_description", function (frm) {
             return {
                 filters: 
                     {
                         "form_type":cur_frm.doc.service_type					}
             };
         });

         frm.set_query( "service_type", function (frm) {
            return {
                filters: 
                    {
                        "module":'Service Type'
                    }
            };
        });

     }
 });

