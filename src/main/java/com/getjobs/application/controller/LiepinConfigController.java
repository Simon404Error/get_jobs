package com.getjobs.application.controller;

import com.getjobs.application.entity.LiepinConfigEntity;
import com.getjobs.application.entity.LiepinOptionEntity;
import com.getjobs.application.entity.BlacklistEntity;
import com.getjobs.application.service.LiepinService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/liepin/config")
public class LiepinConfigController {

    private final LiepinService liepinService;

    public LiepinConfigController(LiepinService liepinService) {
        this.liepinService = liepinService;
    }

    @GetMapping
    public Map<String, Object> getAllConfig() {
        Map<String, Object> result = new HashMap<>();
        LiepinConfigEntity config = liepinService.getFirstConfig();
        if (config == null) config = new LiepinConfigEntity();
        result.put("config", config);

        Map<String, List<LiepinOptionEntity>> options = new HashMap<>();
        options.put("city", liepinService.getOptionsByType("city"));
        result.put("options", options);

        result.put("blacklist", liepinService.getAllBlacklist());
        return result;
    }

    @PutMapping
    public LiepinConfigEntity updateConfig(@RequestBody LiepinConfigEntity config) {
        return liepinService.updateConfig(config);
    }

    @PostMapping("/blacklist")
    public BlacklistEntity addBlacklist(@RequestBody BlacklistEntity blacklist) {
        liepinService.addBlacklist(
            blacklist.getType() != null ? blacklist.getType() : "liepin",
            blacklist.getValue() != null ? blacklist.getValue() : "");
        return blacklist;
    }

    @DeleteMapping("/blacklist/{id}")
    public boolean deleteBlacklist(@PathVariable Long id) {
        List<BlacklistEntity> all = liepinService.getAllBlacklist();
        BlacklistEntity e = all.stream().filter(x -> x.getId().equals(id)).findFirst().orElse(null);
        if (e != null) return liepinService.removeBlacklist(e.getType(), e.getValue());
        return false;
    }
}
