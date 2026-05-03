-- fivem-logging.lua
-- Backend Configuration
local BACKEND_URL = "http://localhost:3000/log"
local IS_DEV_SERVER = GetConvar('isDevServer', 'false') == 'true'
local SERVER_NAME = GetConvar("sv_hostname", "unknown")
local SERVER_ID = GetConvar("sv_projectName", "unknown")

local apikey = "fivem_3d31edce-c1a9-4ba1-837c-f905232c4a1e"

-- Helper: Extract standard player info for the log payload
local function getPlayerInfo(src)
    if not src or src == 0 or src == "" or src == -1 then return nil end
    
    local name = GetPlayerName(src)
    if not name then return nil end

    return {
        id = tonumber(src),
        name = name,
        identifiers = {
            steam = GetPlayerIdentifierByType(src, 'steam'),
            license = GetPlayerIdentifierByType(src, 'license'),
            discord = GetPlayerIdentifierByType(src, 'discord'),
            live = GetPlayerIdentifierByType(src, 'live'),
            fivem = GetPlayerIdentifierByType(src, 'fivem')
        }
    }
end

-- Helper: Send to Node.js Backend
local function sendLogToBackend(eventType, category, payload, extraMeta)
    local body = {
        ["@timestamp"] = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        event_type = eventType,
        category = category,
        isDevServer = IS_DEV_SERVER,
        server = {
            name = SERVER_NAME,
            id = SERVER_ID
        },
        payload = payload
    }

    -- Merge extraMeta (e.g. player object) if provided
    if extraMeta then
        for k, v in pairs(extraMeta) do
            body[k] = v
        end
    end

    PerformHttpRequest(BACKEND_URL, function(err, text, headers)
        if err ~= 200 and err ~= 201 then
            print("^1[Logging] Failed to send log to backend. Status: " .. tostring(err) .. "^0")
        end
    end, "POST", json.encode(body), { ["Content-Type"] = "application/json" })
end

-- Legacy Export Support (Redirects to backend)
local function sendLogThroughApi(channelId, message)
    -- Try to parse the message to extract JSON if possible
    local cleanedMessage = message:gsub("%*%*.-%*%*", ""):gsub("```", ""):match("^%s*(.-)%s*$")
    local decodedMessage = json.decode(cleanedMessage)
    local payload = decodedMessage or { raw_message = message }
    
    sendLogToBackend("legacy_log", "legacy", payload)
end
exports('sendLogThroughApi', sendLogThroughApi)

-- Resource Lifecycle
SetTimeout(1000, function()
    AddEventHandler('onServerResourceStart', function(resourceName)
        local logData = {
            resourceName = resourceName,
            resourceState = GetResourceState(resourceName),
            message = 'Resource ' .. resourceName .. ' has started.'
        }
        sendLogToBackend("resource_start", "resource", logData)
    end)

    AddEventHandler('onServerResourceStop', function(resourceName)
        local logData = {
            resourceName = resourceName,
            resourceState = GetResourceState(resourceName),
            message = 'Resource ' .. resourceName .. ' has stopped.'
        }
        sendLogToBackend("resource_stop", "resource", logData)
    end)
end)

-- Player Lifecycle
AddEventHandler('playerJoining', function(name, setKickReason, deferrals)
    local src = source
    local playerInfo = getPlayerInfo(src)
    local payload = { action = "joining" }
    sendLogToBackend("player_joining", "player", payload, { player = playerInfo })
end)

AddEventHandler('playerDropped', function(reason)
    local src = source
    local playerInfo = getPlayerInfo(src)
    local payload = { reason = reason }
    sendLogToBackend("player_dropped", "player", payload, { player = playerInfo })
end)

-- Chat
RegisterNetEvent('chatMessageEnteredLogging', function(data)
    local src = source
    local playerInfo = getPlayerInfo(src)
    sendLogToBackend("chat_message", "chat", { message_data = data }, { player = playerInfo })
end)

-- Inventory (ox_inventory)
AddEventHandler('onResourceStart', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    if GetResourceState('ox_inventory') ~= 'started' then 
        print('^1[logs] ^0ox_inventory is not started.') 
        return 
    end
    
    -- Assuming ESX is available globally or via exports in the environment
    -- If not, we rely on payload.source and native GetPlayerName

    exports.ox_inventory:registerHook('swapItems', function(payload)
        local src = payload.source
        local playerInfo = getPlayerInfo(src)

        -- Try to get target player info if available
        local fromPlayerInfo = getPlayerInfo(payload.fromInventory) -- might be nil if inventory is not a player
        local toPlayerInfo = getPlayerInfo(payload.toInventory)

        local data = {
            action = payload.action,
            source = payload.source,
            fromSlot = payload.fromSlot,
            toSlot = payload.toSlot,
            count = payload.count,
            coords = payload.coords,
            fromPlayer = fromPlayerInfo,
            toPlayer = toPlayerInfo
        }
    
        sendLogToBackend("item_swapped", "inventory", data, { player = playerInfo })

        -- Diamond check logic from original file
        if payload.fromSlot and payload.fromSlot.name and (payload.fromSlot.name == 'tbx_black_diamonds' or payload.fromSlot.name == 'tbx_pink_diamonds') then
             sendLogToBackend("diamonds_swapped", "inventory", data, { player = playerInfo })
        end
    end, {})

    exports.ox_inventory:registerHook('buyItem', function(payload)
        local src = payload.source
        local playerInfo = getPlayerInfo(src)

        local data = {
            shopType = payload.shopType,
            shopId = payload.shopId,
            itemName = payload.itemName,
            count = payload.count,
            price = payload.price,
            totalPrice = payload.totalPrice,
            currency = payload.currency,
            coords = payload.coords
        }

        sendLogToBackend("item_bought", "inventory", data, { player = playerInfo })
    end, {})
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    if GetResourceState('ox_inventory') ~= 'started' then return end
    exports.ox_inventory:removeHooks()
end)

-- txAdmin Events
RegisterNetEvent('txsv:req:spectate:start', function(targetSource)
    local src = source -- Admin source
    local adminInfo = getPlayerInfo(src)
    local targetInfo = getPlayerInfo(targetSource)

    local payload = {
        targetSource = targetSource,
        targetPlayer = targetInfo
    }

    sendLogToBackend("tx_spectate_start", "txadmin", payload, { player = adminInfo })
end)

RegisterNetEvent('txAdmin:events:playerDirectMessage', function(eventData)
    local targetInfo = getPlayerInfo(eventData.target)
    
    local payload = {
        author = eventData.author,
        message = eventData.message,
        targetPlayer = targetInfo
    }

    sendLogToBackend("tx_dm", "txadmin", payload)
end)

RegisterNetEvent('txAdmin:events:actionRevoked', function(eventData)
    local action = eventData.actionType == 'ban' and 'not_found' or eventData.actionType == 'warn' and 'Warned' or "Unknown"

    local payload = {
        banAuthor = eventData.actionAuthor,
        banReason = eventData.actionReason,
        banType = action,
        playerIds = eventData.playerIds,
        actionId = eventData.actionId,
        revokedBy = eventData.revokedBy
    }

    sendLogToBackend("tx_action_revoked", "txadmin", payload)
end)

RegisterNetEvent('txAdmin:events:playerKicked', function(eventData)
    local targetInfo = getPlayerInfo(eventData.target)
    
    local payload = {
        author = eventData.author,
        reason = eventData.reason,
        targetPlayer = targetInfo
    }

    sendLogToBackend("tx_kicked", "txadmin", payload)
end)

RegisterNetEvent('txAdmin:events:playerBanned', function(eventData)
    local targetInfo = getPlayerInfo(eventData.target)

    local payload = {
        author = eventData.author,
        reason = eventData.reason,
        expiration = eventData.expiration,
        targetPlayer = targetInfo
    }

    sendLogToBackend("tx_banned", "txadmin", payload)
end)

RegisterNetEvent('txAdmin:events:playerWarned', function(eventData)
    local targetInfo = getPlayerInfo(eventData.targetNetId)

    local payload = {
        author = eventData.author,
        reason = eventData.reason,
        actionId = eventData.actionId,
        targetPlayer = targetInfo
    }

    sendLogToBackend("tx_warned", "txadmin", payload)
end)

RegisterNetEvent('txsv:req:healPlayer', function(targetSource)
    local src = source -- Admin
    local adminInfo = getPlayerInfo(src)
    local targetInfo = getPlayerInfo(targetSource)
    
    local payload = {
        targetSource = targetSource,
        everyone = (targetSource == -1),
        targetPlayer = targetInfo
    }

    sendLogToBackend("tx_healed", "txadmin", payload, { player = adminInfo })
end)

RegisterNetEvent('txAdmin:events:announcement', function(eventData)
    local payload = {
        author = eventData.author,
        message = eventData.message
    }

    sendLogToBackend("tx_announcement", "txadmin", payload)
end)

-- ============================================
-- WEAPON & VEHICLE LOGGING
-- ============================================
-- Stats are computed from ES aggregations, no need to send to dashboard

-- Weapon Usage Tracking
-- Call this when a weapon is fired or used
local function logWeaponUsage(weaponName, isKill)
    local src = source
    local playerInfo = getPlayerInfo(src)
    sendLogToBackend("weapon_used", "combat", {
        weaponName = weaponName,
        isKill = isKill or false
    }, { player = playerInfo })
end
exports('logWeaponUsage', logWeaponUsage)

-- Weapon Kill Tracking (call on player death)
AddEventHandler('baseevents:onPlayerDied', function(killerType, deathCoords)
    if killerType and killerType ~= -1 then
        local src = source
        local playerInfo = getPlayerInfo(src)
        
        sendLogToBackend("player_died", "combat", {
            weaponName = tostring(killerType),
            killerType = killerType,
            deathCoords = deathCoords
        }, { player = playerInfo })
    end
end)

AddEventHandler('baseevents:onPlayerKilled', function(killerId, deathData)
    local src = source
    local victimInfo = getPlayerInfo(src)
    local killerInfo = getPlayerInfo(killerId)
    
    local weaponName = deathData.weaponhash or deathData.weapon or "unknown"
    
    sendLogToBackend("player_killed", "combat", {
        killer = killerInfo,
        victim = victimInfo,
        weaponName = tostring(weaponName),
        deathData = deathData
    }, { player = killerInfo })
end)

-- Vehicle Spawn Tracking
local function logVehicleSpawn(vehicleName)
    local src = source
    local playerInfo = getPlayerInfo(src)
    sendLogToBackend("vehicle_spawned", "vehicle", {
        vehicleName = vehicleName
    }, { player = playerInfo })
end
exports('logVehicleSpawn', logVehicleSpawn)

-- ESX vehicle spawn hook
AddEventHandler('esx:spawnVehicle', function(model, coords, heading)
    logVehicleSpawn(model)
end)

-- Generic vehicle spawn event
RegisterNetEvent('logs:vehicleSpawned', function(vehicleName)
    local src = source
    local playerInfo = getPlayerInfo(src)
    
    sendLogToBackend("vehicle_spawned", "vehicle", {
        vehicleName = vehicleName
    }, { player = playerInfo })
end)