using System;using System.IO;using System.Drawing;using System.Drawing.Drawing2D;using System.Drawing.Text;using System.Drawing.Imaging;using System.Web.Script.Serialization;
class SketchRenderer {
 static Graphics g;static Pen ink=new Pen(Color.FromArgb(36,60,70),6);static Pen soft=new Pen(Color.FromArgb(217,210,196),1);static Pen accent=new Pen(Color.FromArgb(214,109,67),9);
 static void Line(float a,float b,float c,float d){g.DrawLine(ink,a,b,c,d);g.DrawLine(soft,a+3,b+2,c+2,d-2);}static void Box(float a,float b,float c,float d){g.DrawRectangle(ink,a,b,c,d);}static void Circle(float a,float b,float r){g.DrawEllipse(ink,a,b,r,r);}static void Person(float x,float y){Circle(x,y,65);Line(x+32,y+65,x+32,y+180);Line(x+32,y+110,x-30,y+155);Line(x+32,y+110,x+95,y+155);Line(x+32,y+180,x-12,y+250);Line(x+32,y+180,x+78,y+250);}
 static int Main(string[] args){try{if(args.Length!=2)return 2;var p=new JavaScriptSerializer().Deserialize<System.Collections.Generic.Dictionary<string,object>>(File.ReadAllText(args[0]));
 using(var b=new Bitmap(1080,1350))using(g=Graphics.FromImage(b))using(var font=new Font("Arial",37,FontStyle.Bold))using(var small=new Font("Arial",21))using(var brush=new SolidBrush(Color.FromArgb(36,60,70)))using(var teal=new SolidBrush(Color.FromArgb(37,121,117))){g.SmoothingMode=SmoothingMode.AntiAlias;g.TextRenderingHint=TextRenderingHint.AntiAliasGridFit;g.Clear(Color.FromArgb(246,240,227));
 for(int y=285;y<1100;y+=28)g.DrawLine(soft,65,y,1015,y);g.FillRectangle(teal,65,60,950,65);g.DrawString((string)p["label"],small,Brushes.White,90,77);g.DrawString((string)p["heading"],font,brush,new RectangleF(65,160,950,120));int variant=Convert.ToInt32(p["variant"]);g.TranslateTransform(0,variant*22);
 switch((string)p["theme"]){
 case "technology":Box(240,400,600,360);Box(270,430,540,275);Line(540,760,540,840);Line(410,840,670,840);foreach(int x in new[]{340,520,700})Circle(x,520,60);Line(400,550,520,550);Line(580,550,700,550);Line(370,580,550,655);Line(730,580,550,655);Circle(520,625,60);break;
 case "health":Box(245,430,590,370);Box(430,350,220,80);Box(490,490,100,230);Box(425,555,230,100);break;
 case "education":Line(540,450,540,850);Line(240,400,540,450);Line(540,450,840,400);Line(240,400,240,790);Line(840,400,840,790);Line(240,790,540,850);Line(540,850,840,790);foreach(int y in new[]{500,570,640}){Line(290,y,480,y+25);Line(600,y+25,790,y);}break;
 case "environment":Line(540,570,540,860);Line(540,680,420,560);Line(540,740,665,610);Circle(340,370,260);Circle(505,365,260);Circle(440,285,230);Line(210,880,865,880);Circle(785,320,70);break;
 case "economy":Box(280,390,300,460);foreach(int x in new[]{320,410,500})foreach(int y in new[]{440,530,620})Box(x,y,38,45);Circle(650,625,175);Circle(690,420,100);Line(180,900,900,900);Line(690,710,785,710);Line(735,660,735,760);break;
 case "travel":Line(155,850,430,420);Line(430,420,650,850);Line(470,850,720,520);Line(720,520,940,850);Circle(765,310,100);Line(150,900,940,900);Line(370,515,430,550);Line(430,550,475,510);break;
 case "music":Line(415,430,415,780);Line(415,430,735,365);Line(735,365,735,715);Circle(315,735,100);Circle(635,670,100);Line(415,500,735,435);break;
 default:Person(240,470);Person(500,400);Person(750,470);Line(180,880,920,880);Circle(460,735,150);break;}
 if(variant==1){Person(115,825);Person(835,825);g.DrawLine(accent,365,970,740,970);}else g.DrawLine(accent,300,950,780,950);g.ResetTransform();g.DrawString((string)p["subtitle"],small,teal,65,1120);g.DrawString(Convert.ToBoolean(p["forecast"])?"Kịch bản giả định • Không phải ảnh chụp sự kiện":"Phác họa theo chủ đề • Không phải ảnh chụp sự kiện",small,brush,new RectangleF(65,1200,950,90));b.Save(args[1],ImageFormat.Png);}
 return 0;}catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}}
}
