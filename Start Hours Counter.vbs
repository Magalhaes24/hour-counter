Dim root, fso, shell
root  = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' First run: install Electron (shows a brief window, only happens once)
If Not fso.FolderExists(root & "\electron\node_modules") Then
    shell.Run "cmd /c cd /d """ & root & "\electron"" && npm install", 1, True
End If

' Launch the desktop app (cmd window hidden, Electron creates its own window)
shell.Run "cmd /c cd /d """ & root & "\electron"" && npm start", 0, False
