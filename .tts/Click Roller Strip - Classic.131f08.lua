--Dice Clicker Strip by MrStump
--You may edit the below variables to change some of the tool's functionality

--By default, this tool can roll 6 different dice types (d4-d20)
--If you put a url into the quotes, you can replace a die with a custom_dice
--If you put a name into the quotes, you can replace the default naming
--Changing the number of sides will make the tool's images not match (obviously)
--Only supports custom_dice, not custom models or asset bundles
ref_diceCustom = {
    {url="http://i.imgur.com/j8d8zPz.png", name="d4", sides=4},  --Default: d4
    {url="http://i.imgur.com/fjtV3gw.png", name="d6", sides=6},  --Default: d6
    {url="http://i.imgur.com/SzI0xzA.png", name="d8", sides=8},  --Default: d8
    {url="http://i.imgur.com/lEeZ1kp.png", name="d10", sides=10}, --Default: d10
    {url="http://i.imgur.com/F3wQ9SQ.png", name="d12", sides=12}, --Default: d12
    {url="http://i.imgur.com/iv6sfnr.png", name="d20", sides=20}, --Default: d20
}
--Note: Names on dice will overwrite default die naming "d4, d6, d8, etc"

--Should the results be public to everyone
broadcast_to_self_only = false

--Chooses what color dice that are rolled are. Options:
    --"default" = dice are default tint (recommended)
    --"player" = dice are tinted to match he color of player who clicked
    --"tool" = dice are tinted to match the color of this tool
dieColor = "player"

--Time before dice disappear. -1 means they do not (until next roll)
removalDelay = 5

--Distance dice are placed from the tool's center
distanceOffset = 2.2
--Length of line dice will be spawned in
widthMaximum = 7
--Distance die gets moved up off the table when spawned
heightOffset = 2
--Die scale, default of 1 (2 is twice the size, 0.5 is half the size)
diceScale = {
    1, --d4
    1, --d6
    1, --d8
    1, --d10
    1, --d12
    1, --d20
}

--How long to wait in seconds before rolling the spawned dice after a click
waitBeforeRoll = 1.8

--How long to wait in seconds before rerolling the aced die
waitBeforeExplodingDie = 2

--How many dice can be spawned. 0 is infinite
dieLimit = 10

--END OF VARIABLES TO EDIT WITHOUT SCRIPTING KNOWLEDGE



--Startup



--Save to track currently active dice for disposal on load
function onSave()
    if #currentDice > 0 then
        local currentDiceGUIDs = {}
        for _, obj in ipairs(currentDice) do
            if obj ~= nil then
                table.insert(currentDiceGUIDs, obj.getGUID())
            end
        end
        saved_data = JSON.encode(currentDiceGUIDs)
    else
        saved_data = ""
    end
    saved_data = ""
    return saved_data
end

function onload(saved_data)
    --Loads the save of any active dice and deletes them
    if saved_data ~= "" then
        local loaded_data = JSON.decode(saved_data)
        for _, guid in ipairs(loaded_data) do
            local obj = getObjectFromGUID(guid)
            if obj ~= nil then
                destroyObject(obj)
            end
        end
        currentDice = {}
    else
        currentDice = {}
    end

    cleanupDice()
    spawnRollButtons()
    currentDice = {}
end



--Button clicked to start rolling process (or add to it)

wild_die_spawned = false
ace_dice_results = {}
aced_wild_die_results = {}

--Activated by click
function click_roll(color, dieIndex)
    --Dice spam protection, can be disabled up at top of script
    local diceCount = 0
    for _ in pairs(currentDice) do
        diceCount = diceCount + 1
    end
    local denyRoll = false
    if dieLimit > 0 and diceCount >= dieLimit then
        denyRoll = true
    end
    if ref_diceCustom[dieIndex].name == "Wild Die" and wild_die_spawned == true then
        denyRoll = true
    end
    
    --Check for if click is allowed
    if rollInProgress == nil and denyRoll == false then
        
        -- clear any previous rolls
        ace_dice_results = {}
        aced_wild_die_results = {}
        
        --Find dice positions, moving previously spawned dice if needed
        local angleStep = 360 / (#currentDice+1)
        for i, die in ipairs(currentDice) do
            die.setPositionSmooth(getPositionInLine(i), false, true)
        end

        --Determines type of die to spawn (custom or not, number of sides)
        local spawn_type = "Custom_Dice"
        local spawn_sides = ref_diceCustom[dieIndex].sides
        local spawn_scale = diceScale[dieIndex]
        if ref_diceCustom[dieIndex].url == "" then
            spawn_type = ref_defaultDieSides[dieIndex]
        end

        --Spawns that die
        local spawn_pos = getPositionInLine(#currentDice+1)
        local spawnedDie = spawnObject({
            type=spawn_type,
            position = spawn_pos,
            rotation = randomRotation(),
            scale={spawn_scale,spawn_scale,spawn_scale}
        })
        if spawn_type == "Custom_Dice" then
            spawnedDie.setCustomObject({
                image = ref_diceCustom[dieIndex].url,
                type = ref_customDieSides[tostring(spawn_sides)]
            })
        end

        --After die is spawned, actions to take on it
        table.insert(currentDice, spawnedDie)
        spawnedDie.setLock(true)
        if ref_diceCustom[dieIndex].name ~= "" then
            spawnedDie.setName(ref_diceCustom[dieIndex].name)
        end
		if dieColor == 'player' then
			spawnedDie.setColorTint(Color.fromString(color))
		elseif dieColor == 'tool' then
			spawnedDie.setColorTint(self.getColorTint())
		end

        --Timer starting
        Timer.destroy("clickRoller_"..self.getGUID())
        Timer.create({
            identifier="clickRoller_"..self.getGUID(), delay=waitBeforeRoll,
            function_name="rollDice", function_owner=self,
            parameters = {color = color}
        })
    elseif rollInProgress == false then
        cleanupDice()
        click_roll(color, dieIndex)
    elseif denyRoll == true and wild_die_spawned == true then
        Player[color].broadcast("Only 1 Wild Die can be rolled at a time.")
    else
        Player[color].broadcast("Roll in progress.", {0.8, 0.2, 0.2})
    end
end



--Die rolling



--Rolls all the dice and then launches monitoring
function rollDice(p)
    rollInProgress = true
    function coroutine_rollDice()
        for _, die in ipairs(currentDice) do
            doRoll(die)
        end

        monitorDice(p.color)

        return 1
    end
    startLuaCoroutine(self, "coroutine_rollDice")
end

function doRoll(die)
    die.setLock(false)
    die.setRotation(randomRotation())
    for i = 1, 4, 1 do
        die.randomize()
        die.roll()
    end
    die.roll()
    wait(0.1)
end

--Monitors dice to come to rest
function monitorDice(color)
    function coroutine_monitorDice()
        repeat
            local allRest = true
            for _, die in ipairs(currentDice) do
                if die ~= nil and die.resting == false then
                    allRest = false
                end
            end
            coroutine.yield(0)
        until allRest == true

        -- Flash Aces (Savage Worlds)
        local flashing = false
        for _, die in ipairs(currentDice) do
            if die ~= nil then
                --Tally value info
                local guid = die.getGUID()
                local value = die.getValue()
                
                -- ace_dice_results = {}
                local rv = die.getRotationValues()
                if value == rv[#rv].value then
                    flash(die)
                    flashing = true
                    local newDie = true
                    for i, v in ipairs(ace_dice_results) do
                        if v.die == guid then
                            newDie = false
                            v.value = v.value + value
                        end
                    end
                    if newDie and die.name ~= "Wild Die" then
                        table.insert(ace_dice_results, {value=value, die=guid})
                    elseif newDie and die.name == "Wild Die" then
                        table.insert(aced_wild_die_results, {value=value, die=guid})
                    end
                end
            end
        end
        
        if flashing then
            wait(waitBeforeExplodingDie) -- Flash a few seconds then reroll
        end
        
        -- Reroll Aces (Savage Worlds)
        local rerolling = false
        for _, die in ipairs(currentDice) do
            if die ~= nil then
                --Tally value info
                local value = die.getValue()
                local rv = die.getRotationValues()
                if value == rv[#rv].value then
                    doRoll(die)
                    rerolling = true
                end
            end
        end
        
        if rerolling then
            monitorDice(color)
        else
            for _, die in ipairs(currentDice) do
                if die ~= nil then
                    --Tally value info
                    local guid = die.getGUID()
                    local value = die.getValue()
                    local newDie = true
                    for i, v in ipairs(ace_dice_results) do
                        if v.die == guid then
                            newDie = false
                            v.value = v.value + value
                        end
                    end
                    if newDie and die.name ~= "Wild Die" then
                        table.insert(ace_dice_results, {value=value, die=guid})
                    elseif newDie and die.name == "Wild Die" then
                        table.insert(aced_wild_die_results, {value=value, die=guid})
                    end
                end
            end
            --Announcement
            displayHighest(color) 
        end

        wait(0.1)
        rollInProgress = false

        --Auto die removal
        if removalDelay ~= -1 then
            --Timer starting
            Timer.destroy("clickRoller_cleanup_"..self.getGUID())
            Timer.create({
                identifier="clickRoller_cleanup_"..self.getGUID(),
                function_name="cleanupDice", function_owner=self,
                delay=removalDelay,
            })
        end

        return 1
    end
    startLuaCoroutine(self, "coroutine_monitorDice")
end



--After roll broadcasting
function displayHighest(color)
    --detect dmg rolls
    if wild_die_spawned == true then
        local total = 0
        for _, die in ipairs(ace_dice_results) do
            if die ~= nil then
                --Tally value info
                local value = die.value
                total = total + value
            end
        end
        broadcast(Player[color].steam_name .. " rolled damage of " .. total, color, {1,1,1})
    else
        --detect critical fails
        
        --Combine our tables to find the final highest result(s)
        for k,v in pairs(aced_wild_die_results) do ace_dice_results[k] = v end
        
        local sort_func = function(a,b) return a.value > b.value end
        table.sort(ace_dice_results, sort_func)
        
        -- This needs work, criitcal is when more then half dice fail when rolling more and must have a wild die failure!
        local fails = {}
        for i, v in ipairs(ace_dice_results) do
            if v.value == 1 then
                table.insert(fails, {1})
            end
        end
        local critical_fail = false
        local numberOfDice = tablelength(ace_dice_results)
        local numberOfFails = tablelength(fails)
        if numberOfDice/2 < numberOfFails then
            broadcast(Player[color].steam_name .. " went Bust! Final Result: " .. ace_dice_results[1].value, color, Color.Red)
        else
            broadcast(Player[color].steam_name .. " rolled: " .. ace_dice_results[1].value, color, {1, 1, 1})
        end
    end
end

function tablelength(T)
  local count = 0
  for _ in pairs(T) do count = count + 1 end
  return count
end

--Die cleanup



function cleanupDice()
    for _, die in ipairs(currentDice) do
        if die ~= nil then
            destroyObject(die)
        end
    end

    Timer.destroy("clickRoller_cleanup_"..self.getGUID())
    rollInProgress = nil
    currentDice = {}
    ace_dice_results = {}
    wild_die_spawned = false
end



--Utility functions

function broadcast(s, p_color, s_color)
    if broadcast_to_self_only == true then
        broadcastToSelf(s, p_color, s_color)
    else
        broadcastToAll(s, s_color)  
    end
end

function broadcastToSelf(s, p_color, s_color)
    broadcastToColor("[Hidden] - " .. s, p_color, s_color)
end

--Return a position based on relative position on a line
function getPositionInLine(i)
    local totalDice = #currentDice + 3
    local totalWidth = widthMaximum
    --Change total width here maybe
    local widthStep = widthMaximum / (totalDice-1)
    local x = -widthStep * i + (widthMaximum/2)
    local y = heightOffset
    local z = -distanceOffset
    return self.positionToWorld({x,y,z})
end

--Gets a random rotation vector
function randomRotation()
    --Credit for this function goes to Revinor (forums)
    --Get 3 random numbers
    local u1 = math.random();
    local u2 = math.random();
    local u3 = math.random();
    --Convert them into quats to avoid gimbal lock
    local u1sqrt = math.sqrt(u1);
    local u1m1sqrt = math.sqrt(1-u1);
    local qx = u1m1sqrt *math.sin(2*math.pi*u2);
    local qy = u1m1sqrt *math.cos(2*math.pi*u2);
    local qz = u1sqrt *math.sin(2*math.pi*u3);
    local qw = u1sqrt *math.cos(2*math.pi*u3);
    --Apply rotation
    local ysqr = qy * qy;
    local t0 = -2.0 * (ysqr + qz * qz) + 1.0;
    local t1 = 2.0 * (qx * qy - qw * qz);
    local t2 = -2.0 * (qx * qz + qw * qy);
    local t3 = 2.0 * (qy * qz - qw * qx);
    local t4 = -2.0 * (qx * qx + ysqr) + 1.0;
    --Correct
    if t2 > 1.0 then t2 = 1.0 end
    if t2 < -1.0 then ts = -1.0 end
    --Convert back to X/Y/Z
    local xr = math.asin(t2);
    local yr = math.atan2(t3, t4);
    local zr = math.atan2(t1, t0);
    --Return result
    return {math.deg(xr),math.deg(yr),math.deg(zr)}
end

--Coroutine delay, in seconds
function wait(time)
    local start = os.time()
    repeat coroutine.yield(0) until os.time() > start + time
end

--Turns an RGB table into hex
function RGBToHex(rgb)
    if rgb ~= nil then
        return "[" .. string.format("%02x%02x%02x", rgb[1]*255,rgb[2]*255,rgb[3]*255) .. "]"
    else
        return ""
    end
end



--Button creation



function spawnRollButtons()
    for i, entry in ipairs(ref_diceCustom) do
        local funcName = "button_"..i
        local func = function(_, c) click_roll(c, i) end
        self.setVar(funcName, func)
        self.createButton({
            click_function=funcName, function_owner=self, color={1,1,1,0},
            position={-2.5+(i-1)*1,0.05,0}, height=330, width=330
        })
    end
end

-- Flash Dice when rolling max

function flash(d, g)
    if not getObjectFromGUID(d.guid) or g and g > 20 then
        return false
    end
    local a = g or 1
    local h = self.getColorTint()
    if a % 2 == 0 then
        h = randomColor()
    end
    if d.tag == "3D Text" then
        d.TextTool.setFontColor(h)
    else
        d.highlightOn(h, 0.1)
    end
    Wait.time(
        function()
            flash(d, a + 1)
        end,
        0.2
    )
end
function randomColor()
    local i = math.random
    return {i(255) / 255, i(255) / 255, i(255) / 255}
end

--Data tables

ref_customDieSides = {["4"]=0, ["6"]=1, ["8"]=2, ["10"]=3, ["12"]=4, ["20"]=5}

ref_customDieSides_rev = {4,6,8,10,12,20}

ref_defaultDieSides = {"Die_4", "Die_6", "Die_8", "Die_10", "Die_12", "Die_20"}
