# Web SQL to Report (Odoo 20)
Auto generate xlsx report from query result or 'list of dictionary' data

Return XLSX Report from the given 'List of Dictionary' data.

**List Of Params :**
- report_name: File name of the report before given datetime at the end of it
- data: data with 'List of Dictionary' type, the key will be Header and the value will be inserted into each row 
- start_date: For report title, if this param is filled, title will generated above header
- end_date: For report title, start_date must be filled to show end_date. end date will shown after start_date
- header: Enable/Disable header (title) option, header text will generated from data key's, underscores '_' will replaced with space and will capitalize unless all words is uppercase 
- header_color: Color of the header, the default will be yellow (#FFFF00)
- capitalize: Enable/Disable auto capitalize for header text
- numbering: Enable/Disable Numbering. Number will generated at first column. The default will be True
- auto_filter: Enable/Disable Auto Filter. 'Auto Filter' will filter first row. The default will be True, however.. this only active when params header is true
- freeze_panes: Enable/Disable Freeze Pane. Freeze first column. The default will be True, however.. this only active when params header is true
- freeze_panes_column: Freeze column from given integer (starting from 0). The default will be 0, however.. this only active when params header & freeze_panes is true
- bottom_remark: Enable/Disable remark Give remark at the bottom of the workbook. The remark contains Downloader name & Download date


**Return :** 

-xlsx file of the generated report


**Usage Example :**
1. 

    def generate_report(self):
        #Example -> get data
        query = " SELECT * from res_partner limit 10"
        self.env.cr.execute(query)
        my_report_data = self.env.cr.dictfetchall()
        
        #Generate report
        return self.env['web.report'].generate_report('My Report Name',my_report_data)

2. From VS Code
   <img width="975" alt="Screenshot 2024-10-09 at 22 52 24" src="https://github.com/user-attachments/assets/6d5c8526-04be-48d1-a9c5-2e2ba7a154fc">


**Authors :**
- Liong (nagara987@gmail.com)
https://www.linkedin.com/in/nagara-liong-50ab07136/

**Result Example :**


![image](https://user-images.githubusercontent.com/52643098/134668255-ffed5b33-52bf-4762-8d60-75b007c2e38d.png)

