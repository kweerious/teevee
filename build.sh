#!/bin/bash

PROJECT=$HOME/Documents/clients/wftda/tv
WEBSITE="http://wftdatv.dev"
WGET=/usr/local/bin/wget

echo "Grabbing site files"
mkdir -p $PROJECT/output
cd $PROJECT/output
$WGET -q -m -nH $WEBSITE
$WGET -q -m -nH $WEBSITE/archives/bout.html
$WGET -q -m -nH $WEBSITE/archives/rinxtest.html
$WGET -q -m -nH $WEBSITE/archives/multibout.html

# echo "Transferring output"
scp -r . deploy@wftda.tv:/home/admin/web/dev/

echo "Build Complete."