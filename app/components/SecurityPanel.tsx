"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, AlertTriangle, Users, Activity } from "lucide-react";
import ErrorDisplay, { LoadingState, EmptyState } from "./ErrorDisplay";
import { ErrorHandler, AppError } from "@/lib/error-handler";

interface SecurityStats {
    totalThreats: number;
    blockedDevices: number;
    recentThreats: Array<{
        id: string;
        type: string;
        severity: string;
        timestamp: string;
        deviceFingerprint: string;
        details: Record<string, unknown>;
    }>;
    topThreatTypes: Record<string, number>;
    activeUsers: number;
    activeIPs: number;
    userDevices: Array<{
        userId: string;
        deviceFingerprint: string;
        userAgent: string;
        platform: string;
        browser: string;
        deviceType: string;
        lastSeen: string;
        loginTime: string;
        ip: string;
    }>;
    activeIPList: Array<{
        ip: string;
        lastSeen: string;
        userAgent: string;
        deviceFingerprint: string;
        requestCount: number;
    }>;
}

export default function SecurityPanel() {
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [showBlockForm, setShowBlockForm] = useState(false);
    const [blockForm, setBlockForm] = useState({
        deviceFingerprint: "",
        ip: "",
        reason: ""
    });
    const [formErrors, setFormErrors] = useState<{
        deviceFingerprint?: string;
        ip?: string;
        reason?: string;
    }>({});

    const fetchStats = async () => {
        try {
            setError(null);
            const response = await fetch("/api/admin/security");

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            } else {
                throw new Error(data.error || "Failed to fetch security data");
            }
        } catch (error) {
            console.error("Error fetching security stats:", error);
            setError(ErrorHandler.handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const validateForm = () => {
        const errors: typeof formErrors = {};

        if (!blockForm.deviceFingerprint && !blockForm.ip) {
            errors.deviceFingerprint = "Either device fingerprint or IP address is required";
            errors.ip = "Either device fingerprint or IP address is required";
        }

        if (blockForm.ip && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(blockForm.ip)) {
            errors.ip = "Please enter a valid IP address";
        }

        if (blockForm.deviceFingerprint && blockForm.deviceFingerprint.length < 10) {
            errors.deviceFingerprint = "Device fingerprint seems too short";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleUnblockDevice = async (deviceFingerprint: string) => {
        setActionLoading(deviceFingerprint);
        setError(null);

        try {
            const response = await fetch("/api/admin/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "unblock_device",
                    deviceFingerprint
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                await fetchStats(); // Refresh stats
                // Show success notification instead of alert
                setError(ErrorHandler.createError(
                    "SUCCESS",
                    "Device unblocked successfully!",
                    "The device can now access the application",
                    200
                ));
                setTimeout(() => setError(null), 3000);
            } else {
                throw new Error(data.error || "Failed to unblock device");
            }
        } catch (error) {
            console.error("Error unblocking device:", error);
            setError(ErrorHandler.handleApiError(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlockDevice = async () => {
        if (!validateForm()) {
            return;
        }

        setActionLoading("block");
        setError(null);
        setFormErrors({});

        try {
            const response = await fetch("/api/admin/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: blockForm.ip ? "block_ip" : "block_device",
                    deviceFingerprint: blockForm.deviceFingerprint,
                    ip: blockForm.ip,
                    reason: blockForm.reason || "Manually blocked by admin"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                await fetchStats();
                setShowBlockForm(false);
                setBlockForm({ deviceFingerprint: "", ip: "", reason: "" });
                setError(ErrorHandler.createError(
                    "SUCCESS",
                    "Blocked successfully!",
                    blockForm.ip ? `IP ${blockForm.ip} has been blocked` : "Device has been blocked",
                    200
                ));
                setTimeout(() => setError(null), 3000);
            } else {
                throw new Error(data.error || "Failed to block");
            }
        } catch (error) {
            console.error("Error blocking device/IP:", error);
            setError(ErrorHandler.handleApiError(error));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <LoadingState message="Loading security data..." />;
    }

    if (error && !stats) {
        return (
            <ErrorDisplay
                error={error}
                onRetry={fetchStats}
                showDetails={true}
            />
        );
    }

    if (!stats) {
        return <LoadingState message="Loading security data..." />;
    }

    return (
        <div className="space-y-6">
            {/* Error Display */}
            {error && (
                <ErrorDisplay
                    error={error}
                    onDismiss={() => setError(null)}
                    showDetails={true}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Security Management</h2>
                </div>
                <button
                    onClick={() => setShowBlockForm(!showBlockForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Lock className="h-4 w-4" />
                    <span>Block Device/IP</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Threats</p>
                            <p className="text-2xl font-bold text-red-600">{stats?.totalThreats || 0}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Blocked Devices</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.blockedDevices || 0}</p>
                        </div>
                        <Lock className="h-8 w-8 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active IPs</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.activeIPs || 0}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Recent Threats</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.recentThreats?.length || 0}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Block Form */}
            {showBlockForm && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Block Device or IP</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Device Fingerprint (Optional)
                            </label>
                            <input
                                type="text"
                                value={blockForm.deviceFingerprint}
                                onChange={(e) => {
                                    setBlockForm({ ...blockForm, deviceFingerprint: e.target.value });
                                    if (formErrors.deviceFingerprint) {
                                        setFormErrors({ ...formErrors, deviceFingerprint: undefined });
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.deviceFingerprint
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                placeholder="Enter device fingerprint"
                            />
                            {formErrors.deviceFingerprint && (
                                <div className="mt-1 text-sm text-red-600">{formErrors.deviceFingerprint}</div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                IP Address (Optional)
                            </label>
                            <input
                                type="text"
                                value={blockForm.ip}
                                onChange={(e) => {
                                    setBlockForm({ ...blockForm, ip: e.target.value });
                                    if (formErrors.ip) {
                                        setFormErrors({ ...formErrors, ip: undefined });
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${formErrors.ip
                                    ? 'border-red-300 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                placeholder="Enter IP address (e.g., 192.168.1.1)"
                            />
                            {formErrors.ip && (
                                <div className="mt-1 text-sm text-red-600">{formErrors.ip}</div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason
                            </label>
                            <input
                                type="text"
                                value={blockForm.reason}
                                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Reason for blocking"
                            />
                        </div>
                        <div className="md:col-span-2 flex space-x-4">
                            <button
                                onClick={handleBlockDevice}
                                disabled={actionLoading === "block"}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading === "block" ? "Blocking..." : "Block"}
                            </button>
                            <button
                                onClick={() => setShowBlockForm(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Threats */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Recent Threats</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Device
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!stats?.recentThreats || stats.recentThreats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <EmptyState
                                            message="No recent threats"
                                            description="No security threats have been detected recently"
                                            icon={Shield}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                stats.recentThreats.slice(0, 10).map((threat) => (
                                    <tr key={threat.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {threat.type.replace(/_/g, ' ').toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${threat.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                threat.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                    threat.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {threat.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {threat.deviceFingerprint.substring(0, 16)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(threat.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleUnblockDevice(threat.deviceFingerprint)}
                                                disabled={actionLoading === threat.deviceFingerprint}
                                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                            >
                                                {actionLoading === threat.deviceFingerprint ? "Unblocking..." : "Unblock"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Active Users</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Platform
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Browser
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Device Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Seen
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!stats?.userDevices || stats.userDevices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <EmptyState
                                            message="No active users"
                                            description="No users are currently logged in"
                                            icon={Users}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                stats.userDevices.map((user) => (
                                    <tr key={user.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.userId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.platform}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.browser}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.deviceType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.lastSeen).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleUnblockDevice(user.deviceFingerprint)}
                                                disabled={actionLoading === user.deviceFingerprint}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                {actionLoading === user.deviceFingerprint ? "Blocking..." : "Block"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Active IPs */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Active IP Addresses</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    IP Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User Agent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Device Fingerprint
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Request Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Seen
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!stats?.activeIPList || stats.activeIPList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <EmptyState
                                            message="No active IPs"
                                            description="No IP addresses are currently accessing the site"
                                            icon={Activity}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                stats.activeIPList.map((ipData) => (
                                    <tr key={ipData.ip}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {ipData.ip}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {ipData.userAgent}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ipData.deviceFingerprint.substring(0, 16)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {ipData.requestCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(ipData.lastSeen).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setBlockForm({
                                                        deviceFingerprint: "",
                                                        ip: ipData.ip,
                                                        reason: "Blocked from active IPs list"
                                                    });
                                                    setShowBlockForm(true);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Block IP
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
