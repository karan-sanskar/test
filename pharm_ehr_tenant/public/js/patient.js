frappe.ui.form.on('Patient', {
	// custom_gender: function (frm) {
	// 	frm.set_value("sex", frm.doc.custom_gender)
	// },
    refresh:function(frm){
        if(frm.doc.custom_patient_status == "Active"){
            frm.page.set_indicator(__("Active"), "green")

        }
        else if(frm.doc.custom_patient_status == "Inactive"){
            frm.page.set_indicator(__("Inactive"), "red")

        }
        else{
            frm.page.set_indicator(__("Transferred"), "yellow")
        }
    },
    onload_post_render: function(frm){
        let description = frappe.db.get_value("Company", frappe.defaults.get_global_default("company"), "custom_mobile_number_format", (r) => {
            if(r.custom_mobile_number_format){
                frm.set_df_property("mobile", "description", "<b>Format for phone number: "+r.custom_mobile_number_format+"</b>")
                frm.set_df_property("custom_pcp_phone", "description", "<b>Format for phone number: "+r.custom_mobile_number_format+"</b>")
            }
        })
    },
    custom_pcp_phone(frm){
        format_mobile(frm, "custom_pcp_phone")
    },
    mobile(frm){
        format_mobile(frm, "mobile")
    },
    format_mobile(frm) {
        frappe.db.get_value("Company", frappe.defaults.get_global_default("company"), "custom_mobile_number_format", (r) => {
            let phoneNumber = frm.doc.mobile;
            let format = r.custom_mobile_number_format
            let formatIndexes = format.split("-");
            let numericPhoneNumber = phoneNumber.replace(/\D/g, ''); 
        
            let formatDig = format.replace(/-/g, "");
        
            if (formatDig.length !== numericPhoneNumber.length && numericPhoneNumber.length > formatDig.length-1) {
                frappe.throw(`Invalid Phone Number Format: ${format}`);
            }
        
            let cIndex = formatIndexes[0].length;
            let countryCode = numericPhoneNumber.substring(0, cIndex);
            let formattedPhoneNumber = countryCode;
        
            for (let i = 1; i < formatIndexes.length; i++) {
                formattedPhoneNumber += "-" + numericPhoneNumber.substring(cIndex, cIndex + formatIndexes[i].length);
                cIndex += formatIndexes[i].length;
            }
        
            // return formattedPhoneNumber;
            frm.set_value("mobile", formattedPhoneNumber)
            })
        }
});

let format_mobile =  function(frm, field) {
    frappe.db.get_value("Company", frappe.defaults.get_global_default("company"), "custom_mobile_number_format", (r) => {
        let phoneNumber = frm.doc[field];
        let format = r.custom_mobile_number_format
        let formatIndexes = format.split("-");
        let numericPhoneNumber = phoneNumber.replace(/\D/g, ''); 
    
        let formatDig = format.replace(/-/g, "");
    
        console.log(formatDig, numericPhoneNumber);
    
        if (formatDig.length !== numericPhoneNumber.length && numericPhoneNumber.length > formatDig.length-1) {
            frappe.throw(`Invalid Phone Number Format: ${format}`);
        }
    
        let cIndex = formatIndexes[0].length;
        let countryCode = numericPhoneNumber.substring(0, cIndex);
        let formattedPhoneNumber = countryCode;
    
        for (let i = 1; i < formatIndexes.length; i++) {
            formattedPhoneNumber += "-" + numericPhoneNumber.substring(cIndex, cIndex + formatIndexes[i].length);
            cIndex += formatIndexes[i].length;
        }
    
        // return formattedPhoneNumber;
        frm.set_value(field, formattedPhoneNumber)
        })
    }