FROM node:16-alpine
RUN apk add python3 libpcap libpcap-dev util-linux
COPY software/libnethogs.so.0.8.5-63-g68033bf /usr/local/lib
COPY software/nethogs-wrapper.py /usr/local/bin 
RUN chmod +x /usr/local/bin/nethogs-wrapper.py
#ADD http://pegasus.isi.edu/montage/Montage_v3.3_patched_4.tar.gz /
#RUN tar zxvf Montage_v3.3_patched_4.tar.gz && \
#    make -C /Montage_v3.3_patched_4 && \
#    echo "export PATH=\$PATH:/Montage_v3.3_patched_4/bin" >> /etc/bash.bashrc && \
#    cd /Montage_v3.3_patched_4 && rm -rf Montage docs grid ../Montage_v3.3_patched_4.tar.gz

ADD software/Montage.tar.gz /
ENV PATH $PATH:/Montage_v3.3_patched_4/bin
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g log4js
COPY . .

CMD [ "npm", "start" ]