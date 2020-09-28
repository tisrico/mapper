#!/bin/bash

BUILD_DIR=./build

function copy_with_new_title()
{
    local src=$1
    local dst=$2
    local title=$3

    if sed "s/<title>Mapper<\/title>/<title>${title}<\/title>/g" $src > $dst; then
        echo "Generated $dst with title \"$title\""
        return 0
    else
        echo "Failed to generated $s with title \"$title\"!"
        return 1
    fi
}

cd $BUILD_DIR

copy_with_new_title index.html omci_mapper.html     "OMCI Mapper"
copy_with_new_title index.html model1_mapper.html   "Model1 Mapper"
copy_with_new_title index.html rdp_mapper.html      "RDP Mapper"