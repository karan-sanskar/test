// Copyright (c) 2024, Aerele and contributors
// For license information, please see license.txt

frappe.ui.form.on("Questionnaires Response", {
    refresh:function(frm){
        frm.set_query("question_no", "vaccine_questions", function (frm) {
             return {
                 filters: 
                     {
                         "form_type":cur_frm.doc.form_type					}
             };
         });
 
     }
});
