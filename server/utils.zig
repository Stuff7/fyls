const std = @import("std");
const fs = std.fs;

pub fn decodeURIComponent(input: []const u8, output_buf: []u8) !usize {
    var out_i: usize = 0;
    var i: usize = 0;

    while (i < input.len) {
        if (out_i >= output_buf.len) return error.OutputBufferTooSmall;

        const c = input[i];
        if (c == '%') {
            if (i + 2 >= input.len)
                return error.URIError;

            const hi = std.fmt.charToDigit(input[i + 1], 16) catch return error.URIError;
            const lo = std.fmt.charToDigit(input[i + 2], 16) catch return error.URIError;

            output_buf[out_i] = @as(u8, hi) << 4 | @as(u8, lo);
            out_i += 1;
            i += 3;
        } else {
            output_buf[out_i] = c;
            out_i += 1;
            i += 1;
        }
    }

    const out_slice = output_buf[0..out_i];
    if (!std.unicode.utf8ValidateSlice(out_slice))
        return error.URIError;

    return out_i;
}

pub fn resizeRetaining(list: *std.ArrayList(u8), cap: usize) !void {
    list.clearRetainingCapacity();
    if (list.capacity < cap) {
        try list.ensureTotalCapacity(cap);
    }
    list.expandToCapacity();
}

pub fn getFileKind(entry_kind: fs.File.Kind, filename: []const u8) []const u8 {
    switch (entry_kind) {
        .directory => return "directory",
        .sym_link => return "symlink",
        .block_device => return "block_device",
        .character_device => return "character_device",
        .named_pipe => return "named_pipe",
        .unix_domain_socket => return "unix_socket",
        .whiteout => return "whiteout",
        .door => return "door",
        .event_port => return "event_port",
        .unknown => return "unknown",
        .file => {
            const ext_start = std.mem.lastIndexOf(u8, filename, ".");
            if (ext_start == null) return "file";

            const ext = filename[ext_start.? + 1 ..];

            if (std.ascii.eqlIgnoreCase(ext, "jpg") or
                std.ascii.eqlIgnoreCase(ext, "jpeg") or
                std.ascii.eqlIgnoreCase(ext, "png") or
                std.ascii.eqlIgnoreCase(ext, "gif") or
                std.ascii.eqlIgnoreCase(ext, "bmp") or
                std.ascii.eqlIgnoreCase(ext, "svg") or
                std.ascii.eqlIgnoreCase(ext, "webp") or
                std.ascii.eqlIgnoreCase(ext, "tiff") or
                std.ascii.eqlIgnoreCase(ext, "ico") or
                std.ascii.eqlIgnoreCase(ext, "heic") or
                std.ascii.eqlIgnoreCase(ext, "avif"))
            {
                return "image";
            }

            if (std.ascii.eqlIgnoreCase(ext, "mp4") or
                std.ascii.eqlIgnoreCase(ext, "avi") or
                std.ascii.eqlIgnoreCase(ext, "mkv") or
                std.ascii.eqlIgnoreCase(ext, "mov") or
                std.ascii.eqlIgnoreCase(ext, "wmv") or
                std.ascii.eqlIgnoreCase(ext, "flv") or
                std.ascii.eqlIgnoreCase(ext, "webm") or
                std.ascii.eqlIgnoreCase(ext, "m4v") or
                std.ascii.eqlIgnoreCase(ext, "3gp") or
                std.ascii.eqlIgnoreCase(ext, "ogv"))
            {
                return "video";
            }

            if (std.ascii.eqlIgnoreCase(ext, "mp3") or
                std.ascii.eqlIgnoreCase(ext, "wav") or
                std.ascii.eqlIgnoreCase(ext, "flac") or
                std.ascii.eqlIgnoreCase(ext, "aac") or
                std.ascii.eqlIgnoreCase(ext, "ogg") or
                std.ascii.eqlIgnoreCase(ext, "wma") or
                std.ascii.eqlIgnoreCase(ext, "m4a") or
                std.ascii.eqlIgnoreCase(ext, "opus") or
                std.ascii.eqlIgnoreCase(ext, "aiff"))
            {
                return "audio";
            }

            if (std.ascii.eqlIgnoreCase(ext, "txt") or
                std.ascii.eqlIgnoreCase(ext, "md") or
                std.ascii.eqlIgnoreCase(ext, "rst") or
                std.ascii.eqlIgnoreCase(ext, "log") or
                std.ascii.eqlIgnoreCase(ext, "cfg") or
                std.ascii.eqlIgnoreCase(ext, "conf") or
                std.ascii.eqlIgnoreCase(ext, "ini") or
                std.ascii.eqlIgnoreCase(ext, "yaml") or
                std.ascii.eqlIgnoreCase(ext, "yml") or
                std.ascii.eqlIgnoreCase(ext, "toml") or
                std.ascii.eqlIgnoreCase(ext, "json") or
                std.ascii.eqlIgnoreCase(ext, "xml") or
                std.ascii.eqlIgnoreCase(ext, "csv"))
            {
                return "text";
            }

            if (std.ascii.eqlIgnoreCase(ext, "c") or
                std.ascii.eqlIgnoreCase(ext, "cpp") or
                std.ascii.eqlIgnoreCase(ext, "cc") or
                std.ascii.eqlIgnoreCase(ext, "cxx") or
                std.ascii.eqlIgnoreCase(ext, "h") or
                std.ascii.eqlIgnoreCase(ext, "hpp") or
                std.ascii.eqlIgnoreCase(ext, "py") or
                std.ascii.eqlIgnoreCase(ext, "js") or
                std.ascii.eqlIgnoreCase(ext, "ts") or
                std.ascii.eqlIgnoreCase(ext, "java") or
                std.ascii.eqlIgnoreCase(ext, "rs") or
                std.ascii.eqlIgnoreCase(ext, "go") or
                std.ascii.eqlIgnoreCase(ext, "zig") or
                std.ascii.eqlIgnoreCase(ext, "php") or
                std.ascii.eqlIgnoreCase(ext, "rb") or
                std.ascii.eqlIgnoreCase(ext, "pl") or
                std.ascii.eqlIgnoreCase(ext, "sh") or
                std.ascii.eqlIgnoreCase(ext, "bash") or
                std.ascii.eqlIgnoreCase(ext, "zsh") or
                std.ascii.eqlIgnoreCase(ext, "ps1") or
                std.ascii.eqlIgnoreCase(ext, "bat"))
            {
                return "code";
            }

            if (std.ascii.eqlIgnoreCase(ext, "pdf") or
                std.ascii.eqlIgnoreCase(ext, "doc") or
                std.ascii.eqlIgnoreCase(ext, "docx") or
                std.ascii.eqlIgnoreCase(ext, "odt") or
                std.ascii.eqlIgnoreCase(ext, "rtf") or
                std.ascii.eqlIgnoreCase(ext, "xls") or
                std.ascii.eqlIgnoreCase(ext, "xlsx") or
                std.ascii.eqlIgnoreCase(ext, "ods") or
                std.ascii.eqlIgnoreCase(ext, "ppt") or
                std.ascii.eqlIgnoreCase(ext, "pptx") or
                std.ascii.eqlIgnoreCase(ext, "odp"))
            {
                return "document";
            }

            if (std.ascii.eqlIgnoreCase(ext, "zip") or
                std.ascii.eqlIgnoreCase(ext, "tar") or
                std.ascii.eqlIgnoreCase(ext, "gz") or
                std.ascii.eqlIgnoreCase(ext, "bz2") or
                std.ascii.eqlIgnoreCase(ext, "xz") or
                std.ascii.eqlIgnoreCase(ext, "7z") or
                std.ascii.eqlIgnoreCase(ext, "rar") or
                std.ascii.eqlIgnoreCase(ext, "deb") or
                std.ascii.eqlIgnoreCase(ext, "rpm") or
                std.ascii.eqlIgnoreCase(ext, "dmg") or
                std.ascii.eqlIgnoreCase(ext, "iso"))
            {
                return "archive";
            }

            if (std.ascii.eqlIgnoreCase(ext, "exe") or
                std.ascii.eqlIgnoreCase(ext, "msi") or
                std.ascii.eqlIgnoreCase(ext, "app") or
                std.ascii.eqlIgnoreCase(ext, "deb") or
                std.ascii.eqlIgnoreCase(ext, "rpm") or
                std.ascii.eqlIgnoreCase(ext, "apk") or
                std.ascii.eqlIgnoreCase(ext, "dmg"))
            {
                return "executable";
            }

            if (std.ascii.eqlIgnoreCase(ext, "html") or
                std.ascii.eqlIgnoreCase(ext, "htm") or
                std.ascii.eqlIgnoreCase(ext, "css") or
                std.ascii.eqlIgnoreCase(ext, "scss") or
                std.ascii.eqlIgnoreCase(ext, "sass") or
                std.ascii.eqlIgnoreCase(ext, "less"))
            {
                return "web";
            }

            if (std.ascii.eqlIgnoreCase(ext, "ttf") or
                std.ascii.eqlIgnoreCase(ext, "otf") or
                std.ascii.eqlIgnoreCase(ext, "woff") or
                std.ascii.eqlIgnoreCase(ext, "woff2") or
                std.ascii.eqlIgnoreCase(ext, "eot"))
            {
                return "font";
            }

            return "file";
        },
    }
}
