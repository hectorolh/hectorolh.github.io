---
layout: post
title: OverTheWire 
subtitle: Bandit
cover-img: assets/img/Overthewire-bandit.jpg
thumbnail-img: assets/img/Overthewire-bandit.jpg
share-img: assets/img/Overthewire-bandit.jpg
tags: [Overthewire,Linux,Challenges]
---
Here I provide the solutions to every level.

```zsh
ssh bandit0@bandit.labs.overthewire.org:2220
bandit0
```
###Bandit Level 0
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
it mentions the size is 1033 bytes so Im gonna list all files in all directories and then grep the size number, ad the -B to show 7 lines above the hit to know in which folder is the file in. Confirm the file is the one we are looking with 'file' command, the file should be human-readable and not executable as well. 

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

cat ./maybehere07/.file2 
P4L4vucdmLnm8I7Vl7jG1ApGSfjYKqJU
```
###Bandit Level 6
```
