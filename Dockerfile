FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ARG BUILD_TYPE=Release

RUN apt-get update && apt-get install -y \
    git cmake build-essential autoconf automake libtool pkg-config texinfo wget yasm nasm \
    libasound2-dev libpulse-dev \
    libx264-dev libvpx-dev libfdk-aac-dev libmp3lame-dev libopus-dev libass-dev libssl-dev \
    nvidia-cuda-toolkit \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Prepare deps directory
WORKDIR /build/deps

# Build NVIDIA Video Codec SDK headers
RUN git clone --depth 1 https://github.com/FFmpeg/nv-codec-headers.git && \
    cd nv-codec-headers && make && make install

# Build x265 static into /build/ffmpeg-static
RUN git clone https://bitbucket.org/multicoreware/x265_git.git x265 && \
    cd x265/build/linux && \
    cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX=/build/ffmpeg-static -DENABLE_SHARED=OFF ../../source && \
    make -j$(nproc) && cp *.a ../../*.a /build/ffmpeg-static/ || true

# Clone and build FFmpeg static with NVIDIA support
WORKDIR /build

RUN git clone https://github.com/ffmpeg/ffmpeg.git && cd ffmpeg && git checkout master

WORKDIR /build/ffmpeg

RUN if [ "$BUILD_TYPE" = "Debug" ]; then \
      EXTRA_FLAGS="--enable-debug"; \
    else \
      EXTRA_FLAGS=""; \
    fi && \
    PKG_CONFIG_PATH=/build/ffmpeg-static/lib/pkgconfig ./configure \
      --prefix=/build/ffmpeg-static \
      --pkg-config-flags="--static" \
      --extra-cflags="-I/build/ffmpeg-static/include -I/usr/local/include -fPIC" \
      --extra-ldflags="-L/build/ffmpeg-static/lib -L/usr/local/lib" \
      --extra-libs="-lx265" \
      --enable-gpl \
      --enable-nonfree \
      --enable-static \
      --disable-shared \
      --enable-libx264 \
      --enable-libx265 \
      --enable-libvpx \
      --enable-libfdk-aac \
      --enable-libmp3lame \
      --enable-libopus \
      --enable-libass \
      --enable-openssl \
      --enable-cuda \
      --enable-cuvid \
      --enable-nvenc \
      --enable-libnpp \
      --disable-debug \
      $EXTRA_FLAGS

RUN make -j$(nproc) && cp ffmpeg ffprobe lib*.a /build/ffmpeg-static/

CMD ["/bin/bash"]
