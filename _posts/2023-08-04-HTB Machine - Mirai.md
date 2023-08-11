---
layout: post
title: HTB Machine - Mirai
subtitle: Writeup
cover-img: 
thumbnail-img: 
share-img: 
tags: [ HTB,Hack the Box,Network,Forensics,Vulnerability Assessment,Authorization,Host,Authentication,Information Disclosure,Default Credentials]
---
Ping analisys: Linux box
Scans:
```zsh
sudo nmap -sS 10.10.10.48 -p- --open --min-rate 5000 -n -Pn -oG ./nmap/allports
sudo nmap -sCV 10.10.10.48 -p22,53,80,1058,32400,32469 -oN ./nmap/targeted
whatweb http://10.10.10.48
http://10.10.10.48 [404 Not Found] Country[RESERVED][ZZ], HTTPServer[lighttpd/1.4.35], IP[10.10.10.48], UncommonHeaders[x-pi-hole], lighttpd[1.4.35]
```
Interesting technologies to research after the initial scan: pi-hole and
dnsmasq

When trying to browse the webpage it renders blank so I suspect another webpage could be available. Let’s try and fuzz it. 

```zsh
ffuf -c -t 200 -w /usr/share/seclists/Discovery/Web-Content/big.txt -u http://10.10.10.48/FUZZ -ic
admin
```
there is an admin page that could be available. By going there we are presented with the Pi-hole panel. If we look for default credential for this software we come across with pi:raspberry. We know that another open port is 22, so let us ssh with those credentials. 
```zsh
ssh pi@10.10.10.48
```
we gained access to the box and with that we can retrieve our first flag. Let us check what can this user run
```
sudo -l
```
the user can run all without password so if we elevate our privileges to root and go for the second flag in /root/root.txt

Hold your horses, not that easy. There is nothing but a message. The flag is now in a usb stick. If we poke around the system filesystem we come across /media/usbstick. We are gold. 

Once again we have been trolled. Our flag is not there and again a message saying that our flag is no longer there as it has been...DELETED! oh no! that’s it, file deleted means file lost...

Wait...A file that gets deleted just means the metadata around the file gets changed to tell the OS that that memory is now available for writing. That means if we can read the raw memory, the flag could still be there. So we need to find where our raw data is. Isn't the /media/usbstick the raw data? Nope, that’s the mount point for our raw data. To determine where the raw data reside we need to ask lsblk
```
lsblk
```
with that we can see that sdb is where are raw data is, but where is sdb? google how to mount/umount media and you will see. 

now that we now where our raw data is, we need to read it. If we use strings we can deduce the flag from the output. 
```
strings sdb
```
