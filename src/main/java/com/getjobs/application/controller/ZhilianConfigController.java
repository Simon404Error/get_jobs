package com.getjobs.application.controller;

import com.getjobs.application.entity.ZhilianConfigEntity;
import com.getjobs.application.entity.ZhilianOptionEntity;
import com.getjobs.application.entity.BlacklistEntity;
import com.getjobs.application.service.ZhilianService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/zhilian/config")
public class ZhilianConfigController {

    private final ZhilianService zhilianService;

    public ZhilianConfigController(ZhilianService zhilianService) {
        this.zhilianService = zhilianService;
    }

    @GetMapping
    public Map<String, Object> getAllConfig() {
        Map<String, Object> result = new HashMap<>();
        ZhilianConfigEntity config = zhilianService.getFirstConfig();
        if (config == null) {
            config = new ZhilianConfigEntity();
        }
        result.put("config", config);

        Map<String, List<ZhilianOptionEntity>> options = new HashMap<>();
        options.put("city", zhilianService.getOptionsByType("city"));
        result.put("options", options);

        List<BlacklistEntity> blacklist = zhilianService.getAllBlacklist();
        result.put("blacklist", blacklist);

        return result;
    }

    @PutMapping
    public ZhilianConfigEntity updateConfig(@RequestBody ZhilianConfigEntity config) {
        return zhilianService.updateConfig(config);
    }

    @PostMapping("/blacklist")
    public BlacklistEntity addBlacklist(@RequestBody BlacklistEntity blacklist) {
        String value = blacklist.getValue() != null ? blacklist.getValue() : "";
        String type = blacklist.getType() != null ? blacklist.getType() : "zhilian";
        zhilianService.addBlacklist(type, value);
        return blacklist;
    }

    @DeleteMapping("/blacklist/{id}")
    public boolean deleteBlacklist(@PathVariable Long id) {
        List<BlacklistEntity> all = zhilianService.getAllBlacklist();
        BlacklistEntity entity = all.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElse(null);
        if (entity != null) {
            return zhilianService.removeBlacklist(entity.getType(), entity.getValue());
        }
        return false;
    }
}
