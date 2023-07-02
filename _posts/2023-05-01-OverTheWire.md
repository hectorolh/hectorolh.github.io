---
layout: post
title: OverTheWire 
subtitle: Bandit
cover-img: /assets/img/Overthewire-bandit.jpg
thumbnail-img: /assets/img/Overthewire-bandit.jpg
share-img: /assets/img/Overthewire-bandit.jpg
tags: [Overthewire,Linux,Challenges]
---
Here I provide the solutions to every level.

```zsh
ssh bandit5@bandit.labs.overthewire.org -p2220
bandit0
###Bandit Level 0
```
```zsh
ls
cat readme
NH2SXQwcBdpmTEzi3bvBHMM9H66vVXjL
```
###Bandit Level 1

In this case, you will need to specify the option < before the dash (-) file.
```zsh
cat < -
rRGizSaX8Mk1RTb1CNQoXTcYZWU6lgzi
```
You can also use the option ./ before the dash (-) file to view the content of the file:
```zsh
cat ./-
rRGizSaX8Mk1RTb1CNQoXTcYZWU6lgzi
```
###Bandit Level 2
```zsh
cat 'spaces in this filename' 
aBZ0W5EmUfAf7kHTQeOwd8bauFJ2lAiG
```
###Bandit Level 3
```zsh
cd inhere
inhere$ ls -la
cat .hidden
2EW7BBsr6aMMoJ2HjW067dm8EgX26xNe
```
###Bandit Level 4
we will check the file type of each file with the command 'file'. We can iterate over a range of numbers to check it quickly. After that there is only one file with ASCII type. 
```zsh
for i in {00..09}; do file ./-file$i; done
./-file00: data
./-file01: data
./-file02: data
./-file03: data
./-file04: data
./-file05: data
./-file06: data
./-file07: ASCII text
./-file08: data
./-file09: Non-ISO extended-ASCII text, with no line terminators

cat ./-file07
lrIWWI6bB37kxfiCQZqUdOIYfr6eEeqR
```
###Bandit Level 5
it mentions the size is 1033 bytes so Im gonna list all files in all directories and then grep the size number, ad the -B to show 7 lines above the hit to know in which folder is the file in. Confirm the file is the one we are looking with 'file' command, the file should be human-readable and not executable as well. We can also use find and specify the type as a file, then the size (1033) and the ! to indicate what we dont want with the expression after it -executable. 

```zsh

ls -laR | grep 1033 -B 7
./maybehere07:
total 56
drwxr-x---  2 root bandit5 4096 Apr 23 18:04 .
drwxr-x--- 22 root bandit5 4096 Apr 23 18:04 ..
-rwxr-x---  1 root bandit5 3663 Apr 23 18:04 -file1
-rwxr-x---  1 root bandit5 3065 Apr 23 18:04 .file1
-rw-r-----  1 root bandit5 2488 Apr 23 18:04 -file2
-rw-r-----  1 root bandit5 1033 Apr 23 18:04 .file2

bandit5@bandit:~/inhere$ file ./maybehere07/.file2
./maybehere07/.file2: ASCII text, with very long lines (1000)

find ./ -type f -size 1033c ! -executable

cat ./maybehere07/.file2 
P4L4vucdmLnm8I7Vl7jG1ApGSfjYKqJU
```
###Bandit Level 6
```zsh
find / -size 33c -user bandit7 -group bandit6 -type f 2>/dev/null
/var/lib/dpkg/info/bandit7.password

cat /var/lib/dpkg/info/bandit7.password
z7WtoNQU2XfjmMtWA8u5rN4vzqu4v99S
```
###Bandit Level 7
```zsh
cat data.txt | grep millionth
millionth	TESKZC0XvTetK0S9xNwm25STk5iWrBvP
```
###Bandit Level 8
```zsh
sort data.txt | uniq -u
EN632PlfYiZbn3PhVK3XOGSlNInNE00t
```
###Bandit Level 9
```zsh
strings data.txt | grep ==
4========== the#
========== password
========== is
========== G7w8LIi6J3kTb8A7j9LgrywtEUlyyp6s
```
###Bandit Level 10
```zsh
file data.txt
data.txt: ASCII text

cat data.txt 
VGhlIHBhc3N3b3JkIGlzIDZ6UGV6aUxkUjJSS05kTllGTmI2blZDS3pwaGxYSEJNCg==

base64 -d data.txt
The password is 6zPeziLdR2RKNdNYFNb6nVCKzphlXHBM
```
###Bandit Level 11
```zsh
cat data.txt | tr 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm' 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
The password is JVNBBFSmZwKKOP0XbFXOoW8chDz5yVRv
```
###Bandit Level 12
first create a directory in tmp and then copy the file to that folder. Then use the xxd command to turn the hex into a zippedfile
```zsh
mkdir /tmp/ricky
cp data.txt /tmp/ricky
xxd -r data.txt zippedfile
``` 
the next commands are use in a rinse and repeat form, the idea is that everytime we decompress a file we check the file type and decompress further depending on the format, for gzip the file needs to be renamed to have the .gz extension. 
```zsh
mv zippedfile zippedfile.gz
gzip -d zippedfile.gz
bzip2 -d zippedfile
tar -xvf zippedfile
tar -xvf data5.bin

cat data8
The password is wbWdlBxEir4CaE8LaPhauuOo6pwRmrDw
```
###Bandit Level 13
```zsh
 ssh -i sshkey.private bandit14@bandit.labs.overthewire.org -p2220
```
###Bandit Level 14
```zsh
cat /etc/bandit_pass/bandit14
fGrHPx402xGC7U7rXKDaxiWFTOiF0ENq

telnet localhost 30000
fGrHPx402xGC7U7rXKDaxiWFTOiF0ENq
Correct!
jN2kgmIXJ6fShzhT2avhotn4Zcka6tnt
```
###Bandit Level 15
```zsh
openssl s_client -connect localhost:30001
jN2kgmIXJ6fShzhT2avhotn4Zcka6tnt
Correct!
JQttfApK4SeyHwDlI9SXGR50qclOAil1
```
###Bandit Level 16
```zsh
nmap localhost -p31000-32000 
nmap -sC localhost -p31046,31518,31691,31790,31960
Starting Nmap 7.80 ( https://nmap.org ) at 2023-06-03 05:53 UTC
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00010s latency).

PORT      STATE SERVICE
31046/tcp open  unknown
31518/tcp open  unknown
| ssl-cert: Subject: commonName=localhost
| Subject Alternative Name: DNS:localhost
| Not valid before: 2023-06-02T09:57:36
|_Not valid after:  2023-06-02T09:58:36
31691/tcp open  unknown
31790/tcp open  unknown
| ssl-cert: Subject: commonName=localhost
| Subject Alternative Name: DNS:localhost
| Not valid before: 2023-06-02T09:57:36
|_Not valid after:  2023-06-02T09:58:36
31960/tcp open  unknown

openssl s_client -connect localhost:31790

JQttfApK4SeyHwDlI9SXGR50qclOAil1
Correct!
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAvmOkuifmMg6HL2YPIOjon6iWfbp7c3jx34YkYWqUH57SUdyJ
imZzeyGC0gtZPGujUSxiJSWI/oTqexh+cAMTSMlOJf7+BrJObArnxd9Y7YT2bRPQ
Ja6Lzb558YW3FZl87ORiO+rW4LCDCNd2lUvLE/GL2GWyuKN0K5iCd5TbtJzEkQTu
DSt2mcNn4rhAL+JFr56o4T6z8WWAW18BR6yGrMq7Q/kALHYW3OekePQAzL0VUYbW
JGTi65CxbCnzc/w4+mqQyvmzpWtMAzJTzAzQxNbkR2MBGySxDLrjg0LWN6sK7wNX
x0YVztz/zbIkPjfkU1jHS+9EbVNj+D1XFOJuaQIDAQABAoIBABagpxpM1aoLWfvD
KHcj10nqcoBc4oE11aFYQwik7xfW+24pRNuDE6SFthOar69jp5RlLwD1NhPx3iBl
J9nOM8OJ0VToum43UOS8YxF8WwhXriYGnc1sskbwpXOUDc9uX4+UESzH22P29ovd
d8WErY0gPxun8pbJLmxkAtWNhpMvfe0050vk9TL5wqbu9AlbssgTcCXkMQnPw9nC
YNN6DDP2lbcBrvgT9YCNL6C+ZKufD52yOQ9qOkwFTEQpjtF4uNtJom+asvlpmS8A
vLY9r60wYSvmZhNqBUrj7lyCtXMIu1kkd4w7F77k+DjHoAXyxcUp1DGL51sOmama
+TOWWgECgYEA8JtPxP0GRJ+IQkX262jM3dEIkza8ky5moIwUqYdsx0NxHgRRhORT
8c8hAuRBb2G82so8vUHk/fur85OEfc9TncnCY2crpoqsghifKLxrLgtT+qDpfZnx
SatLdt8GfQ85yA7hnWWJ2MxF3NaeSDm75Lsm+tBbAiyc9P2jGRNtMSkCgYEAypHd
HCctNi/FwjulhttFx/rHYKhLidZDFYeiE/v45bN4yFm8x7R/b0iE7KaszX+Exdvt
SghaTdcG0Knyw1bpJVyusavPzpaJMjdJ6tcFhVAbAjm7enCIvGCSx+X3l5SiWg0A
R57hJglezIiVjv3aGwHwvlZvtszK6zV6oXFAu0ECgYAbjo46T4hyP5tJi93V5HDi
Ttiek7xRVxUl+iU7rWkGAXFpMLFteQEsRr7PJ/lemmEY5eTDAFMLy9FL2m9oQWCg
R8VdwSk8r9FGLS+9aKcV5PI/WEKlwgXinB3OhYimtiG2Cg5JCqIZFHxD6MjEGOiu
L8ktHMPvodBwNsSBULpG0QKBgBAplTfC1HOnWiMGOU3KPwYWt0O6CdTkmJOmL8Ni
blh9elyZ9FsGxsgtRBXRsqXuz7wtsQAgLHxbdLq/ZJQ7YfzOKU4ZxEnabvXnvWkU
YOdjHdSOoKvDQNWu6ucyLRAWFuISeXw9a/9p7ftpxm0TSgyvmfLF2MIAEwyzRqaM
77pBAoGAMmjmIJdjp+Ez8duyn3ieo36yrttF5NSsJLAbxFpdlc1gvtGCWW+9Cq0b
dxviW8+TFVEBl1O4f7HVm6EpTscdDxU+bCXWkfjuRb7Dy9GOtt9JPsX8MBTakzh3
vBgsyi/sN3RqRBcGU40fOoZyfAMT8s1m/uYv52O6IgeuZ/ujbjY=
-----END RSA PRIVATE KEY-----
vim id_rsa
chmod 600 id_rsa
ssh -i id_rsa bandit17@bandit.labs.overthewire.org -p2220
```
###Bandit Level 17
```zsh
diff passwords.old passwords.new
hga5tuuCLF6fFzUpnagiMN8ssu9LFrdg
```
###Bandit Level 18
we need to bypass the config file .bashrc. A quick google search provides the answer. We know that is the bash config because ssh gives the typical welcome for the machines, then the byebye appears which seems to be from the bash script then. 

```zsh
ssh bandit18@bandit.labs.overthewire.org -p2220 "bash --noprofile --norc"

cat readme
awhqfNnAbc1naukrpqDYcF95h7HoMTrC
```
###Bandit Level 19
there is a binary in the landing folder, trying to run we can see the instructions. Run per instructions and then go for our pass using the same binary. 
```zsh
ls
bandit20-do

file bandit20-do 
bandit20-do: setuid ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux.so.2, BuildID[sha1]=c148b21f7eb7e816998f07490c8007567e51953f, for GNU/Linux 3.2.0, not stripped

./bandit20-do 
Run a command as another user.
  Example: ./bandit20-do id

./bandit20-do id  
uid=11019(bandit19) gid=11019(bandit19) euid=11020(bandit20) groups=11019(bandit19)

./bandit20-do cat /etc/bandit_pass/bandit20                    
VxCazJaVykI6W36BkBU0mJTCM8rR95XT
```
###Bandit Level 20
```zsh
netcat -l 52390 & 	#this will leave nc running in the background

./suconnect 52390	#run the suconnect pending the previous pass. Set it to bg with ctrl+z 
^Z
[2]+  Stopped                 ./suconnect 52390

fg %1				#bring the nc to the fg, input the pass and set it to bg again.  
netcat -l 52390
VxCazJaVykI6W36BkBU0mJTCM8rR95XT
^Z

fg %2				#bring the suconnect so it reads the pass and set to bg again. 
./suconnect 52390
Read: VxCazJaVykI6W36BkBU0mJTCM8rR95XT
Password matches, sending next password

fg %1				#brin the nc to fg and take the pass for the next level. 
netcat -l 52390
NvEJF7oVjkddltPSrdKEFOllh9V1IBcq
```
###Bandit Level 21
Follow the path. 
```zsh
ls /etc/cron.d/
cronjob_bandit15_root  cronjob_bandit22  cronjob_bandit24       e2scrub_all  sysstat
cronjob_bandit17_root  cronjob_bandit23  cronjob_bandit25_root  otw-tmp-dir

ls -la /etc/cron.d/cronjob_bandit22
-rw-r--r-- 1 root root 120 Apr 23 18:04 /etc/cron.d/cronjob_bandit22

cat /etc/cron.d/cronjob_bandit22   
@reboot bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null
* * * * * bandit22 /usr/bin/cronjob_bandit22.sh &> /dev/null

cat /usr/bin/cronjob_bandit22.sh
#!/bin/bash
chmod 644 /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
cat /etc/bandit_pass/bandit22 > /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv

cat /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv                                              
WdDozAdTM2z9DiFEQ2mGlwngMfj4EZff
```
###Bandit Level 22
```zsh
ls /etc/cron.d/
cronjob_bandit15_root  cronjob_bandit22  cronjob_bandit24       e2scrub_all  sysstat
cronjob_bandit17_root  cronjob_bandit23  cronjob_bandit25_root  otw-tmp-dir


cat /etc/cron.d/cronjob_bandit23   
@reboot bandit23 /usr/bin/cronjob_bandit23.sh  &> /dev/null
* * * * * bandit23 /usr/bin/cronjob_bandit23.sh  &> /dev/null
```
There is script file that generates a md5 according to the response of the command whoami. Then it copy the pass for the next level in a folder with the name generated in the previous step. We just have to follow the same instructions to find our pass.

```zsh
cat /usr/bin/cronjob_bandit23.sh
#!/bin/bash

myname=$(whoami)
mytarget=$(echo I am user $myname | md5sum | cut -d ' ' -f 1)

echo "Copying passwordfile /etc/bandit_pass/$myname to /tmp/$mytarget"

cat /etc/bandit_pass/$myname > /tmp/$mytarget


whoami
bandit22

echo I am user bandit22 | md5sum | cut -d ' ' -f 1
8169b67bd894ddbb4412f91573b38db3

cat /tmp/8169b67bd894ddbb4412f91573b38db3
WdDozAdTM2z9DiFEQ2mGlwngMfj4EZff
```
###Bandit Level 23
```zsh

