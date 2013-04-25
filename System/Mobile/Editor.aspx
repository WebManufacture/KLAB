<%@ Page Language="C#"  EnableEventValidation="false" ValidateRequest="false" %>
<%@ Import Namespace="MRS.Core.Parsers" %>
<%@ Import Namespace="MRS.Web" %>
<%@ Import Namespace="MRS.Web.UI" %>
<%@ Import Namespace="System.IO" %>

<!DOCTYPE html!>

<script runat="server">
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        var requestPath = Request["file"];
        if (requestPath == null) requestPath = "";
        var path = Server.MapPath("~/" + requestPath);
        BaseContentParser parser = new BaseContentParser(path);
        txtMode.Text = parser.Parse();
    }
    
    protected void Save_File(object sender, EventArgs ev)
    {
        var requestPath = Request["file"];
        if (requestPath == null) requestPath = "";
        var path = Server.MapPath("~/" + requestPath);
        StreamWriter writer = new StreamWriter(path, false, Encoding.UTF8);
        writer.Write(txtMode.Text);
        writer.Close();
    }
</script>

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title></title>
</head>
<body>
    <form id="HtmlForm" runat="server">
        <asp:Button runat="server" ID="btnSave" OnClick="Save_File" Text="���������" />
       <asp:TextBox ID="txtMode" runat="server" TextMode="MultiLine" style="width: 100%; height: 100%;"></asp:TextBox>
    </form>
</body>
</html>
