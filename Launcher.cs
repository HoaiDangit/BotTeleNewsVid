using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
class Launcher {
 [STAThread] static int Main() {
  string root=AppDomain.CurrentDomain.BaseDirectory;
  string script=Path.Combine(root,"start-studio.ps1");
  if(!File.Exists(script)){MessageBox.Show("Keep this EXE beside start-video.ps1.","NewsAutoBear");return 1;}
  var p=new ProcessStartInfo();
  p.FileName=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),@"WindowsPowerShell\v1.0\powershell.exe");
  p.Arguments="-NoProfile -File \""+script+"\"";
  p.WorkingDirectory=root;p.UseShellExecute=false;p.CreateNoWindow=true;
  try{using(var child=Process.Start(p)){child.WaitForExit();return child.ExitCode;}}
  catch(Exception e){MessageBox.Show(e.Message,"NewsAutoBear");return 1;}
 }
}
