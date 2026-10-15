using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Text;
using System.Threading;
using System.Windows.Forms;
class Launcher : Form {
 string root=AppDomain.CurrentDomain.BaseDirectory;
 TextBox status=new TextBox(); Button start=new Button(); Button refresh=new Button();
 System.Windows.Forms.Timer timer=new System.Windows.Forms.Timer(); bool busy=false;
 Launcher(){
  Text="NewsAutoBear — Studio và Telegram";ClientSize=new Size(690,380);StartPosition=FormStartPosition.CenterScreen;
  Font=new Font("Segoe UI",10);MinimumSize=new Size(706,419);
  status.Multiline=true;status.ReadOnly=true;status.ScrollBars=ScrollBars.Vertical;status.SetBounds(20,20,650,260);status.Anchor=AnchorStyles.Top|AnchorStyles.Left|AnchorStyles.Right|AnchorStyles.Bottom;
  start.Text="Khởi động";start.SetBounds(20,295,135,38);start.Click+=(s,e)=>Run("--start");
  refresh.Text="Kiểm tra lại";refresh.SetBounds(165,295,135,38);refresh.Click+=(s,e)=>Run("--status");
  var open=new Button();open.Text="Mở Studio";open.SetBounds(310,295,135,38);open.Click+=(s,e)=>Process.Start("http://127.0.0.1:4000");
  var logs=new Button();logs.Text="Mở nhật ký";logs.SetBounds(455,295,135,38);logs.Click+=(s,e)=>Process.Start("explorer.exe","\""+Path.Combine(root,".bridge")+"\"");
  var hint=new Label();hint.Text="Đóng cửa sổ này không tắt Studio hoặc cầu nối. Trạng thái tự cập nhật mỗi 10 giây.";hint.SetBounds(20,345,650,28);
  Controls.AddRange(new Control[]{status,start,refresh,open,logs,hint});
  timer.Interval=10000;timer.Tick+=(s,e)=>Run("--status");timer.Start();Shown+=(s,e)=>Run("--start");
 }
 void Run(string mode){
  if(busy)return;busy=true;start.Enabled=false;refresh.Enabled=false;status.Text=mode=="--start"?"Đang khởi động và kiểm tra kết nối…":"Đang kiểm tra…";
  ThreadPool.QueueUserWorkItem(delegate {
   string result;
   try {
    string script=Path.Combine(root,"launcher-status.mjs");if(!File.Exists(script))throw new Exception("Thiếu launcher-status.mjs. Giữ EXE trong thư mục teleSetup.");
    var p=new ProcessStartInfo("node.exe","\""+script+"\" "+mode);p.WorkingDirectory=root;p.UseShellExecute=false;p.CreateNoWindow=true;p.RedirectStandardOutput=true;p.RedirectStandardError=true;p.StandardOutputEncoding=Encoding.UTF8;p.StandardErrorEncoding=Encoding.UTF8;
    using(var child=Process.Start(p)){string output=child.StandardOutput.ReadToEnd();string error=child.StandardError.ReadToEnd();child.WaitForExit();result=output+error;if(String.IsNullOrWhiteSpace(result))result="Chưa có kết quả. Mở nhật ký để kiểm tra.";}
   }catch(Exception e){result="Không khởi động được: "+e.Message+"\r\nKiểm tra Node.js đã cài và EXE nằm trong thư mục teleSetup.";}
   if(!IsDisposed)BeginInvoke((Action)delegate {status.Text=result.Replace("\n","\r\n");busy=false;start.Enabled=true;refresh.Enabled=true;});
  });
 }
 [STAThread] static void Main(){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new Launcher());}
}
