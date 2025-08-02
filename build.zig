const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const main_module = b.createModule(.{
        .root_source_file = b.path("server/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const suffix = switch (optimize) {
        .Debug => "-dbg",
        .ReleaseFast => "",
        .ReleaseSafe => "-s",
        .ReleaseSmall => "-sm",
    };

    const NAME = "fyls";
    var name_buf: [NAME.len + 4]u8 = undefined;
    const bin_name = std.fmt.bufPrint(@constCast(&name_buf), "{s}{s}", .{ NAME, suffix }) catch unreachable;

    const exe = b.addExecutable(.{ .name = bin_name, .root_module = main_module });
    b.installArtifact(exe);

    const check = b.addExecutable(.{ .name = bin_name, .root_module = main_module });
    const check_step = b.step("check", "Build for LSP Diagnostics");
    check_step.dependOn(&check.step);
}

// fn addBuild(b: *std.Build, main_module: *std.Build.Module, bin_name: []const u8) *std.Build.Step.Compile {
//     const exe = b.addExecutable(.{ .name = bin_name, .root_module = main_module });
//
//     exe.root_module.addIncludePath(.{ .cwd_relative = "build/include" });
//
//     exe.addObjectFile(.{ .cwd_relative = "build/lib/libavcodec.a" });
//     exe.linkLibC();
//
//     return exe;
// }
