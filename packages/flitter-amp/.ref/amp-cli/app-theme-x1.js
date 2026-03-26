// Amp CLI - App Theme Class (x1) and Theme Container (Qt)
// Extracted from minified bundle
// Defines all semantic color assignments for the application

class x1{
  toolRunning;toolSuccess;toolError;toolCancelled;toolName;
  userMessage;assistantMessage;systemMessage;
  codeBlock;inlineCode;syntaxHighlight;
  fileReference;processing;waiting;completed;cancelled;
  recommendation;suggestion;command;filename;keybind;button;link;
  shellMode;shellModeHidden;handoffMode;handoffModeDim;queueMode;
  diffAdded;diffRemoved;diffChanged;diffContext;
  ideConnected;ideDisconnected;ideWarning;
  scrollbarThumb;scrollbarTrack;tableBorder;
  selectionBackground;selectionForeground;selectedMessage;
  smartModeColor;rushModeColor;
  threadGraphNode;threadGraphNodeSelected;threadGraphConnector;

  constructor({toolRunning:H,toolSuccess:L,toolError:A,toolCancelled:I,toolName:D,
    userMessage:t,assistantMessage:f,systemMessage:B,codeBlock:u,inlineCode:M,
    syntaxHighlight:o,fileReference:p,processing:P,waiting:E,completed:C,cancelled:e,
    suggestion:s,command:T,filename:h,keybind:r,button:l,link:d,
    shellMode:c,shellModeHidden:x,handoffMode:a,handoffModeDim:n,queueMode:S,
    diffAdded:i,diffRemoved:U,diffChanged:_,diffContext:v,
    ideConnected:W,ideDisconnected:b,ideWarning:F,
    scrollbarThumb:N,scrollbarTrack:O,tableBorder:y,
    selectionBackground:K,selectionForeground:Q,selectedMessage:k,
    recommendation:DH,smartModeColor:tH,rushModeColor:AH,
    threadGraphNode:EH,threadGraphNodeSelected:$H,threadGraphConnector:fH}){
    this.toolRunning=H,this.toolSuccess=L,this.toolError=A,this.toolCancelled=I,
    this.toolName=D,this.userMessage=t,this.assistantMessage=f,this.systemMessage=B,
    this.codeBlock=u,this.inlineCode=M,this.syntaxHighlight=o,this.fileReference=p,
    this.processing=P,this.waiting=E,this.completed=C,this.cancelled=e,
    this.suggestion=s,this.command=T,this.filename=h,this.keybind=r,this.button=l,
    this.link=d,this.shellMode=c,this.shellModeHidden=x,this.handoffMode=a,
    this.handoffModeDim=n,this.queueMode=S,this.diffAdded=i,this.diffRemoved=U,
    this.diffChanged=_,this.diffContext=v,this.ideConnected=W,this.ideDisconnected=b,
    this.ideWarning=F,this.scrollbarThumb=N,this.scrollbarTrack=O,this.tableBorder=y,
    this.selectionBackground=K,this.selectionForeground=Q,this.selectedMessage=k,
    this.recommendation=DH,this.smartModeColor=tH,this.rushModeColor=AH,
    this.threadGraphNode=EH,this.threadGraphNodeSelected=$H,this.threadGraphConnector=fH
  }

  static default(H="dark"){
    let L=H==="light",
        A=L?gH.rgb(0,140,70):gH.rgb(0,255,136),   // smartModeColor
        I=L?gH.rgb(180,100,0):gH.rgb(255,215,0);   // rushModeColor
    return new x1({
      toolRunning:gH.blue,
      toolSuccess:gH.green,
      toolError:gH.red,
      toolCancelled:gH.yellow,
      toolName:gH.default(),
      userMessage:gH.cyan,
      assistantMessage:gH.default(),
      systemMessage:gH.index(8),
      codeBlock:gH.default(),
      inlineCode:gH.yellow,
      syntaxHighlight:{
        keyword:gH.blue,
        string:gH.green,
        number:gH.yellow,
        comment:gH.index(8),
        function:gH.cyan,
        variable:gH.default(),
        type:gH.magenta,
        operator:gH.default()
      },
      fileReference:gH.cyan,
      processing:gH.blue,
      waiting:gH.yellow,
      completed:gH.green,
      cancelled:gH.index(8),
      recommendation:gH.blue,
      suggestion:gH.magenta,
      command:gH.yellow,
      filename:gH.cyan,
      keybind:gH.blue,
      button:gH.cyan,
      link:gH.blue,
      shellMode:gH.blue,
      shellModeHidden:gH.index(8),
      handoffMode:gH.magenta,
      handoffModeDim:gH.rgb(128,0,128),
      queueMode:gH.rgb(160,160,160),
      diffAdded:gH.green,
      diffRemoved:gH.red,
      diffChanged:gH.yellow,
      diffContext:gH.index(8),
      ideConnected:gH.green,
      ideDisconnected:gH.red,
      ideWarning:gH.yellow,
      scrollbarThumb:gH.default(),
      scrollbarTrack:gH.index(8),
      tableBorder:gH.index(8),
      selectionBackground:gH.yellow,
      selectionForeground:gH.black,
      selectedMessage:gH.green,
      smartModeColor:A,
      rushModeColor:I,
      threadGraphNode:gH.blue,
      threadGraphNodeSelected:gH.yellow,
      threadGraphConnector:gH.default()
    })
  }
}

// Qt = Theme container combining base (ColorScheme/wd) + app (x1)
class Qt{
  base;app;
  constructor({base:H,app:L}){this.base=H,this.app=L}
  get colors(){return this.base.colorScheme}
  static default(){return new Qt({base:YB.default(),app:x1.default()})}
  static fromBaseTheme(H,L="dark"){return new Qt({base:H,app:x1.default(L)})}
}

// Ym = agent mode color function
function Ym(H){let L=nk()==="light";if(H==="smart")return L?gH.rgb(0,140,70):gH.rgb(0,255,136);if(H==="rush")return L?gH.rgb(180,100,0):gH.rgb(255,215,0);let A=CE(H)?.uiHints?.secondaryColor;if(A)return gH.rgb(A.r,A.g,A.b);return C5L(H)}

// Color reference (gH = Color utility):
// gH.default() = terminal default foreground
// gH.index(N)  = ANSI 256-color index
// gH.rgb(r,g,b)= true color
// gH.blue, gH.green, etc. = standard ANSI colors
