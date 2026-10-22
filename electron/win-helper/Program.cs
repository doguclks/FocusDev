using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;

namespace WinTracker
{
    internal class Program
    {
        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern int GetWindowTextW(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        [DllImport("user32.dll")]
        private static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

        private const int SW_MINIMIZE = 6;
        private const byte VK_LWIN = 0x5B;
        private const byte VK_H = 0x48;
        private const uint KEYEVENTF_KEYUP = 0x0002;

        [StructLayout(LayoutKind.Sequential)]
        private struct LASTINPUTINFO
        {
            public uint cbSize;
            public uint dwTime;
        }

        private static uint GetIdleTimeSeconds()
        {
            var lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(lii);
            if (GetLastInputInfo(ref lii))
            {
                uint envTicks = (uint)Environment.TickCount;
                if (envTicks >= lii.dwTime)
                {
                    return (envTicks - lii.dwTime) / 1000;
                }
            }
            return 0;
        }

        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;

            // Background thread to read commands from stdin (e.g., "minimize_active")
            new Thread(() =>
            {
                while (true)
                {
                    try
                    {
                        string? line = Console.ReadLine();
                        if (line == null)
                        {
                            // Stdin closed, parent died
                            Environment.Exit(0);
                            return;
                        }
                        if (line.Trim() == "MINIMIZE")
                        {
                            IntPtr currentHwnd = GetForegroundWindow();
                            if (currentHwnd != IntPtr.Zero)
                            {
                                ShowWindowAsync(currentHwnd, SW_MINIMIZE);
                            }
                        }
                        else if (line.Trim() == "VOICE_TYPING")
                        {
                            keybd_event(VK_LWIN, 0, 0, 0);
                            Thread.Sleep(50);
                            keybd_event(VK_H, 0, 0, 0);
                            Thread.Sleep(50);
                            keybd_event(VK_H, 0, KEYEVENTF_KEYUP, 0);
                            Thread.Sleep(50);
                            keybd_event(VK_LWIN, 0, KEYEVENTF_KEYUP, 0);
                        }
                    }
                    catch
                    {
                        break;
                    }
                }
            })
            { IsBackground = true }.Start();

            // Loop every 1000ms
            while (true)
            {
                try
                {
                    IntPtr hwnd = GetForegroundWindow();
                    string title = "";
                    string processName = "Unknown";
                    uint pid = 0;

                    if (hwnd != IntPtr.Zero)
                    {
                        var sb = new StringBuilder(1024);
                        if (GetWindowTextW(hwnd, sb, sb.Capacity) > 0)
                        {
                            title = sb.ToString();
                        }

                        GetWindowThreadProcessId(hwnd, out pid);
                        if (pid > 0)
                        {
                            try
                            {
                                using var proc = Process.GetProcessById((int)pid);
                                processName = proc.ProcessName;
                            }
                            catch { }
                        }
                    }

                    uint idleSecs = GetIdleTimeSeconds();

                    var report = new
                    {
                        title = title,
                        process = processName,
                        pid = pid,
                        idleSeconds = idleSecs,
                        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    };

                    string json = JsonSerializer.Serialize(report);
                    Console.WriteLine(json);
                    Console.Out.Flush();
                }
                catch (Exception ex)
                {
                    // Ignore transient errors
                }

                Thread.Sleep(1000);
            }
        }
    }
}
