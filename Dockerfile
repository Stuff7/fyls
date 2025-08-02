FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ARG BUILD_TYPE=Release

# Install build tools and codec libraries
RUN apt-get update && apt-get install -y \
    autoconf automake build-essential cmake git libtool \
    pkg-config texinfo wget yasm nasm \
    libx264-dev libvpx-dev libfdk-aac-dev libmp3lame-dev \
    libopus-dev libass-dev libssl-dev \
    nvidia-cuda-toolkit \
    && rm -rf /var/lib/apt/lists/*;

# Set up install and build directories
ENV INSTALL_DIR=/build/ffmpeg
RUN mkdir -p /build /deps ${INSTALL_DIR}/lib ${INSTALL_DIR}/include;

# Build NVIDIA Video Codec SDK headers
WORKDIR /deps
RUN git clone --depth 1 https://github.com/FFmpeg/nv-codec-headers.git && \
    cd nv-codec-headers && make && make install;

# Build x265 static
WORKDIR /deps
RUN git clone https://bitbucket.org/multicoreware/x265_git.git x265 && \
    cd x265/build/linux && \
    cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX=${INSTALL_DIR} -DENABLE_SHARED=OFF ../../source && \
    make -j$(nproc) && make install;

# Clone FFmpeg source to a temporary location
WORKDIR /tmp
RUN git clone https://github.com/ffmpeg/ffmpeg.git && \
    cd ffmpeg && git checkout master;

# Configure FFmpeg to only build static libraries and headers
WORKDIR /tmp/ffmpeg
ENV PKG_CONFIG_PATH=${INSTALL_DIR}/lib/pkgconfig
RUN ./configure \
    --prefix=${INSTALL_DIR} \
    --pkg-config-flags="--static" \
    --extra-cflags="-I${INSTALL_DIR}/include -I/usr/local/include -fPIC" \
    --extra-ldflags="-L${INSTALL_DIR}/lib -L/usr/local/lib" \
    --extra-libs="-lx265" \
    --enable-gpl \
    --enable-nonfree \
    --enable-static \
    --disable-shared \
    --disable-programs \
    --disable-doc \
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
    $([ "$BUILD_TYPE" = "Debug" ] && echo --enable-debug);

# Build and install only the libs + headers
RUN make -j$(nproc) && make install;
