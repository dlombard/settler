#!bin/bash

apt-get update && apt-get upgrade && apt-get dist-upgrade
sudo addgroup oneclick_user
sudo adduser  --disabled-password --gecos ""  --shell /bin/bash --ingroup oneclick_user oneclick_user
sudo usermod -aG sudo oneclick_user

sudo mkdir -p /home/oneclick_user/.ssh
touch /home/oneclick_user/.ssh/authorized_keys

chmod 700 /home/oneclick_user/.ssh
chmod 600 /home/oneclick_user/.ssh/authorized_keys

sudo chown -R oneclick_user:oneclick_user /home/oneclick_user/.ssh

echo 'oneclick_user ALL=(ALL)	NOPASSWD: ALL' >> /etc/sudoers

cat >  /home/oneclick_user/.ssh/authorized_keys <<  EOF

